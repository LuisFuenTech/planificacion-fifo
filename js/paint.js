(function() {
  "use strict";

  var width = 960,
    height = 500;

  var margin = {
    top: 25,
    left: 5
  };

  var rect = {
    width: 18,
    height: 40
  };

  var xDomain = width / rect.width;
  var yDomain = height / rect.height;

  var y = d3.scale
    .linear()
    .domain([0, yDomain])
    .range([0, height]);

  var x = d3.scale
    .linear()
    .domain([0, xDomain])
    .range([0, width]);

  var xAxis = d3.svg
    .axis()
    .scale(x)
    .tickSize(height)
    .ticks(xDomain / 2)
    .orient("top");

  var yAxis = d3.svg
    .axis()
    .scale(y)
    .tickSize(width)
    .orient("right")
    .ticks(yDomain)
    .tickFormat("");

  var svg = d3
    .select("svg")
    .attr("width", 0)
    .attr("height", 0)
    .append("g")
    .attr("transform", "translate(0, " + margin.top + ")");

  var gy = svg
    .append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ", " + 0 + ")")
    .call(yAxis);

  var gx = svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + margin.left + ", " + 0 + ")")
    .call(xAxis);

  var bar = svg
    .append("g")
    .attr("class", "bar")
    .attr("transform", "translate(5, " + (height - rect.height) + ")");

  function repintar_cuadricula(svgWidth, svgHeight) {
    svgHeight += 10;
    svgWidth += 200;

    xDomain = svgWidth / rect.width;

    x.domain([0, xDomain]).range([0, svgWidth]);

    xAxis
      .scale(x)
      .ticks(xDomain / 2)
      .tickSize(svgHeight);

    yAxis.tickSize(svgWidth);

    yDomain = svgHeight / rect.height;

    y.domain([0, yDomain]).range([0, svgHeight]);

    yAxis
      .tickSize(svgWidth)
      .scale(y)
      .ticks(yDomain);

    gy.call(yAxis);
    gx.attr(
      "transform",
      "translate(" + margin.left + ", " + svgHeight + ")"
    ).call(xAxis);
  }

  window.pintarProceso = function(proceso, length) {
    var svgHeight = Number(d3.select("svg").attr("height"));
    var svgWidth = Number(d3.select("svg").attr("width"));
    var rectY = -(height - rect.height * length);

    d3.select("svg").attr("height", svgHeight + rect.height + 6);
    d3.select("svg").attr("width", svgWidth + rect.width * proceso.rafaga + 6);

    repintar_cuadricula(svgWidth, svgHeight);

    var rectRestante = bar
      .append("rect")
      .attr("class", "restante proceso-" + (length - 1))
      .attr("x", proceso.llegada * rect.width)
      .attr("y", rectY)
      .attr("width", proceso.finalizacion * rect.width)
      .attr("height", rect.height);

    var rectEspera = bar
      .append("rect")
      .attr("class", "espera proceso-" + (length - 1))
      .attr("x", proceso.llegada * rect.width)
      .attr("y", rectY)
      .attr("width", proceso.espera * rect.width)
      .attr("height", rect.height);

    var rectEjecucion = bar
      .append("rect")
      .attr("class", "ejecucion proceso-" + (length - 1))
      .attr("x", proceso.comienzo * rect.width)
      .attr("y", rectY)
      .attr("width", proceso.rafaga * rect.width)
      .attr("height", rect.height);

    var textoNombre = bar
      .append("text")
      .attr("class", "texto-nombre proceso-" + (length - 1))
      .attr("x", proceso.finalizacion * rect.width + 30)
      .attr("y", rectY + margin.top)
      .text(proceso.nombre)
      .style("fill", "red");

    var textoEspera = bar
      .append("text")
      .attr("class", "texto-espera proceso-" + (length - 1))
      .attr("x", proceso.llegada * rect.width + 5)
      .attr("y", rectY + margin.top);

    if (proceso.espera > 0) {
      textoEspera.text(proceso.espera);
    }

    var textoRafaga = bar
      .append("text")
      .attr("class", "texto-rafaga proceso-" + (length - 1))
      .attr("x", proceso.comienzo * rect.width + 5)
      .attr("y", rectY + margin.top)
      .text(proceso.rafaga);

    var textoRestante = bar
      .append("text")
      .attr("class", "texto-restante proceso-" + (length - 1))
      .attr("y", rectY + margin.top);

    if (proceso.bloqueado) {
      rectRestante.classed("bloqueado", true);
      rectEspera.classed("bloqueado", true);
      rectEjecucion.classed("bloqueado", true);

      rectRestante
        .attr(
          "width",
          (proceso.finalizacionTotal - proceso.bloqueado) * rect.width
        )
        .attr("x", proceso.bloqueado * rect.width);

      rectEjecucion.attr(
        "width",
        (proceso.bloqueado - proceso.comienzo) * rect.width
      );

      textoRafaga.text(proceso.bloqueado - proceso.comienzo);
      textoRestante
        .attr("x", proceso.bloqueado * rect.width + 5)
        .text(proceso.finalizacionTotal - proceso.bloqueado);
    }
  };
})();
