var svg = d3.select("svg");

var width = +svg.attr("width"),
height = +svg.attr("height")
var container = svg.append("g");
svg.call(d3.zoom().on("zoom",zoomed));

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
.force("link", d3.forceLink().id(function(d) { return d.id; }))
.force("charge", d3.forceManyBody())
.force("center", d3.forceCenter(width / 2, height / 2));

var author_groups = [];
d3.text("author_groups.csv", function(text) {
  d3.csvParseRows(text, function(d, i) {
    author_groups.push({id:d[0],group:parseInt(d[1])})
  });



  d3.text("papers_greg.csv", function(text) {
    var all_authors = [];
    var data = d3.csvParseRows(text, function(d, i) {
      var paper_authors = d[2].replace(/, /g,",").replace('.','').split(',');
      all_authors = all_authors.concat(paper_authors);
      return {
        title: d[0],
        authors: paper_authors,
        date: d[10]
      };
    });

    var unique_authors=_.uniq(all_authors);
    var author_selection= unique_authors.map(function(x) { return { author: x }; });
    $('#author_selection').selectize({
      options: author_selection,
      labelField: "author",
      valueField: "author",
      searchField:"author",
      onChange: function(value){
        d3.selectAll("circle").attr("r", 5);

        var selected_authors = value.split(",");
        selected_authors.forEach(function(author) {
          $("#"+author.replace(/ /g,"_")).attr('r',10);
        });
      }
    });


    var authors_counts = _.countBy(all_authors);
    var links_counts = {};

    for(paper in data){
      var authors = data[paper]["authors"];
      authors.sort();
      for(var i = 0; i < (authors.length-1);i++){
        for (var j = i+1; j < authors.length;j++){
          var pair = authors[i]+'--'+authors[j];
          if(pair in links_counts){
            links_counts[pair] += 1;
          } else {
            links_counts[pair] = 1;
          }
        }
      }
    }

    var nodes = _(_.map(authors_counts,function(num,author) {return {id:author,num:num}})).concat(author_groups).groupBy('id').map(_.spread(_.assign)).value();
    var links = _.map(links_counts,function(count,pair) {return {source:pair.split("--")[0],target:pair.split("--")[1],value:count}});



    var link = container.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
    .attr("stroke-opacity", function(d) { return d.value/50; });

    var node = container.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("id",function(d) {return d.id.replace(/ /g,"_");})
    .attr("r", 5)
    .attr("fill", function(d) { return color(d.group); })
    .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

    node.append("title")
    .text(function(d) { return d.id; });

    simulation
    .nodes(nodes)
    .on("tick", ticked);

    simulation.force("link")
    .links(links);

    function ticked() {
      link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

      node
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
    }
  });
});
function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function zoomed() {
  container.attr("transform", d3.event.transform);
}
