(function(){


    var radius = 400;
    var dendogramContainer = "speciescollapsible";
    var dendogramDataSource = "./MindBodySoul.json";
  
    var rootNodeSize = 20;
    var levelOneNodeSize = 12;
    var levelTwoNodeSize = 10;
    var levelThreeNodeSize = 7;
  
  
    var i = 0;
    var duration = 300; //Changing value doesn't seem any changes in the duration ??
  
    var rootJsonData;
  
    var cluster = d3.layout.cluster()
        .size([360,radius - 120])
        .separation(function(a, b) {
          return (a.parent == b.parent ? 1 : 3) / a.depth;
        });
  
    var diagonal = d3.svg.diagonal.radial()
        .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
  
    var containerDiv = d3.select(document.getElementById(dendogramContainer));
  
    containerDiv.append("button")
        .attr("id","collapse-button")
        .text("Collapse!")
        .on("click",collapseLevels);
      
      //add expand button
      containerDiv.append("button")
        .attr("id","expand-button")
        .text("Expand!")
        .on("click",expandLevels);
  
    var svgRoot = containerDiv.append("svg:svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", "-" + (radius) + " -" + (radius - 200) +" "+ radius*2 +" "+ radius*2)
        .call(d3.behavior.zoom().scale(0.9).scaleExtent([0.1, 3]).on("zoom", zoom)).on("dblclick.zoom", null)
        .append("svg:g");
  
    // Add the clipping path
    svgRoot.append("svg:clipPath").attr("id", "clipper-path")
        .append("svg:rect")
        .attr('id', 'clip-rect-anim');
  
    var animGroup = svgRoot.append("svg:g")
        .attr("clip-path", "url(#clipper-path)");
  
    d3.json(dendogramDataSource, function(error,jsonData){
        if(error) return console.warn(error);
        rootJsonData = jsonData;
  
      //Start with all children collapsed
      rootJsonData.children.forEach(collapse);
  
      //Initialize the dendrogram
        createCollapsibleDendroGram(rootJsonData);
  
    });
  
  
    function createCollapsibleDendroGram(source) {
  
      // Compute the new tree layout.
      var nodes = cluster.nodes(rootJsonData);
      var pathlinks = cluster.links(nodes);
  
      // Normalize for nodes' fixed-depth.
      nodes.forEach(function(d) {
        if(d.depth <=2){
          d.y = d.depth*70;
        }else
        {
          d.y = d.depth*100;
        }
      });
  
      // Update the nodes…
      var node = svgRoot.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });
  
      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .on("click", toggleChildren);
  
      nodeEnter.append("circle");
  
      nodeEnter.append("text")
      .attr("x", 10)
      .attr("dy", ".35em")
      .attr("text-anchor", "start")
      .text(function(d) {
          //affects what is returned as text on depth 2
          //   if(d.depth === 2){
          //     return d.alias;
          //   }
          
           return d.name;
      });
  
  
      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
  
      nodeUpdate.select("circle")
          .attr("r", function(d){
              if (d.depth == 0) {
                  return rootNodeSize;
                }
                else if (d.depth === 1) {
                    return levelOneNodeSize;
                }
                else if (d.depth === 2) {
                    return levelTwoNodeSize;
                }
                    return levelThreeNodeSize;
  
          })
          .style("fill", function(d) {
                 if(d.depth ===0){
                  return "#808080";
                 }else if(d.depth === 1){
                    return d.color
                //   if(d.name=="MIND") return "#f0ac02";
                //   if(d.name=="BODY") return "#0279f0";
                //   if(d.name=="SOUL") return "#7902f0";
                //   return "#C3B9A0";
                 }else{
                    return groupColour(d);
                //   return d.color;
                 }
          })
          .style("stroke",function(d){
                if(d.depth>1){
                    return "white";
                }
                else{
                    return "lightgray";
                }
          });
  
      nodeUpdate.select("text")
  
          .attr('id', function(d){
            var order = 0;
            if(d.order)order = d.order;
            return 'T-' + d.depth + "-" + order;
          })
          .attr("text-anchor", function (d) {
              if (d.depth === 1) {
                  return d.x < 180 ? "end" : "start";
              }
              return d.x < 180 ? "start" : "end";
          })
          .attr("dy", function(d){
              if (d.depth === 1) {
                  return d.x < 180 ? "1.4em" : "-0.2em";
              }
              return ".31em";
          })
          .attr("dx", function (d) {
              if (d.depth === 1) {
                  return 0; //return d.x > 180 ? 2 : -2;
              }
              return d.x < 180 ? 1 : -20;
          })
          .attr("transform", function (d) {
              if (d.depth < 2) {
                  return "rotate(" + (90 - d.x) + ")";
              }else {
                  return d.x < 180 ? null : "rotate(180)";
              }
          });
  
      // TODO: appropriate transform
      var nodeExit = node.exit().transition()
          .duration(duration)
          .remove();
  
      // Update the links…
      var link = svgRoot.selectAll("path.link")
          .data(pathlinks, function(d) { return d.target.id; });
  
      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
          .attr("class", "link")
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          })
          .style("fill",function(d){
            return d.color;
          });
  
      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr("d", diagonal);
  
      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();
    }
  
    // Toggle children on click.
    function toggleChildren(d,clickType) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
  
      var type = typeof clickType == undefined ? "node" : clickType;
  
      //Activities on node click
      createCollapsibleDendroGram(d);
      highlightNodeSelections(d);
  
      highlightRootToNodePath(d,type);
  
    }
  
    // Collapse nodes
    function collapse(d) {
      if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
    }
  









    //Expand nodes
    function expand(d){   
      var children = (d.children)?d.children:d._children;
      if (d._children) {        
          d.children = d._children;
          d._children = null;       
      }
      if(children)
        children.forEach(expand);
  }
  
  function expandLevels(){
    console.log('expand', rootJsonData);
      expand(rootJsonData); 
      createCollapsibleDendroGram(rootJsonData);
      // update(rootJsonData);
  }

  function mouseover(d) {
    d3.select(this).append("text")
        .attr("class", "hover")
        .attr('transform', function(d){ 
            return 'translate(5, -10)';
        })
        .text(d.name + ": " + d.id);
}

// Toggle children on click.
function mouseout(d) {
    d3.select(this).select("text.hover").remove();
}

  function update(source) {

    // Compute the new tree layout.
    var nodes = cluster.nodes(rootJsonData).reverse(),
        links = cluster.links(nodes);
  
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });
  
    // Update the nodes…
    var node = svgRoot.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });
  
    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", toggleChildren)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
  
    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
  
    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6);
  
    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
  
    nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
  
    nodeUpdate.select("text")
        .style("fill-opacity", 1);
  
    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();
  
    nodeExit.select("circle")
        .attr("r", 1e-6);
  
    nodeExit.select("text")
        .style("fill-opacity", 1e-6);
  
    // Update the links…
    var link = svgRoot.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });
  
    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });
  
    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);
  
    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();
  
    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

    // function expandLevels() {
    //   console.log('expand', rootJsonData);
    //   rootJsonData.children.forEach((d)=>{
    //    expand(d)     
    //   })
    
    // }

    // function expand(d){
    //   if (d._children) {
    //     d.children = d._children;
    //     d._children = null;
    //   }   
    // }
  
  
  




    // highlights subnodes of a node
    function highlightNodeSelections(d) {
        var highlightLinkColor = "darkslategray";//"#f03b20";
        var defaultLinkColor = "lightgray";
  
        var depth =  d.depth;
        var nodeColor = d.color;
        if (depth === 1) {
            nodeColor = highlightLinkColor;
        }
  
        var pathLinks = svgRoot.selectAll("path.link");
  
        pathLinks.style("stroke",function(dd) {
            if (dd.source.depth === 0) {
                if (d.name === '') {
                    return highlightLinkColor;
                }
                return defaultLinkColor;
            }
  
            if (dd.source.name === d.name) {
                return nodeColor;
            }else {
                return defaultLinkColor;
            }
        });
    }
  
    //Walking parents' chain for root to node tracking
    function highlightRootToNodePath(d,clickType){
      var ancestors = [];
      var parent = d;
      while (!_.isUndefined(parent)) {
          ancestors.push(parent);
          parent = parent.parent;
      }
  
      // Get the matched links
      var matchedLinks = [];
  
      svgRoot.selectAll('path.link')
          .filter(function(d, i)
          {
              return _.any(ancestors, function(p)
              {
                  return p === d.target;
              });
  
          })
          .each(function(d)
          {
              matchedLinks.push(d);
          });
  
      animateChains(matchedLinks,clickType);
  
      function animateChains(links,clickType){
        animGroup.selectAll("path.selected")
            .data([])
            .exit().remove();
  
        animGroup.selectAll("path.selected")
            .data(links)
            .enter().append("svg:path")
            .attr("class", "selected")
            .attr("d", diagonal);
  
  
        //Reset path highlight if collapse button clicked
        if(clickType == 'button'){
          animGroup.selectAll("path.selected").classed('reset-selected',true);
        }
  
        var overlayBox = svgRoot.node().getBBox();
  
        svgRoot.select("#clip-rect-anim")
            .attr("x", -radius)
            .attr("y", -radius)
            .attr("width",0)
            .attr("height",radius*2)
            .transition().duration(duration)
            .attr("width", radius*2);
      }
  
    }
  
    function zoom() {
       svgRoot.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
  
    function collapseLevels(){
  
      if(checkForThirdLevelOpenChildren()){
        toggleAllSecondLevelChildren();
      }else{
       toggleSecondLevelChildren();
      }
  
      // Open first level only by collapsing second level
      function toggleSecondLevelChildren(){
        for(rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex<rootLength; rootIndex++){
            if(isNodeOpen(rootJsonData.children[rootIndex])){
                 toggleChildren(rootJsonData.children[rootIndex],'button');
            }
        }
      }
  
      // Open first level only by collapsing second level
      function toggleAllSecondLevelChildren(){
        for(rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex<rootLength; rootIndex++){
          if(isNodeOpen(rootJsonData.children[rootIndex])){
  
            for(childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex<childLength; childIndex++){
              var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];
              if(isNodeOpen(secondLevelChild)){
                toggleChildren(rootJsonData.children[rootIndex].children[childIndex],'button');
              }
            }
  
          }
  
        }
      }
  
      // Check if any nodes opens at second level
      function checkForThirdLevelOpenChildren(){
        for(rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex<rootLength; rootIndex++){
          if(isNodeOpen(rootJsonData.children[rootIndex])){
  
            for(childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex<childLength; childIndex++){
  
              var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];
              if(isNodeOpen(secondLevelChild)){
                return true;
              }
            }
          }
        }
      }
  
      function isNodeOpen(d){
        if(d.children){return true;}
        return false;
      }
    }
    
  })();




  //AAUXILLAY FUBNCTION 
  var stringToColour = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '';
    for (var i = 0; i < 3; i++) {
      var value = (hash >> (i * 8)) & 0xFF;
      colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
  }

  var groupColour = function(d){
    var parentCol = findParentColor(d);
    var nameCol = stringToColour(d.name);
    var finalCol = colorTone(parentCol,nameCol);
    //console.log(finalCol);
    return parentCol
  }

  var findParentColor = function(d){
    if(d.depth>1){
      return findParentColor(d.parent)
    }else{ 
      return d.color
    }
  }

  //takes to hex numbers returns averaged hex number
  var colorTone = function(c1,c2){
    var c1num = parseInt(c1,16);
    var c2num = parseInt(c2,16);
    var num = (c1num*2+ c2num)/2
    var hexnum = num.toString(16);
    return '#'+hexnum;

  }