(function() {
  "use strict";

  // Variables globales
  var colaListos = [];
  var colaBloqueados = [];
  var numeroProcesos = 0;
  var tiempoActual = 0;
  var tiempoLlegada = 0;
  var procesoActual = 0;
  var pausado = false;

  var timerValidarProceso = 0;
  var timerAgregarProceso = 0;

  var rect = {
    width: 18,
    height: 40
  };

  var constantes = {
    TIEMPO_ESPERA: 5000,
    PROCESOS_INICIALES: 1,
    RAFAGA_RANDOM: 10
  };

  // Clases
  function Proceso() {
    this.nombre = "Proceso";
    this.llegada = 0;
    this.rafaga = 0;
    this.comienzo = 0;
    this.finalizacion = 0;
    this.retorno = 0;
    this.espera = 0;
    this.prioridad = 0;
    this.bloqueado = false;
  }

  function Main() {}

  // Funciones
  function agregarProcesoListo(proceso) {
    colaListos.push(proceso);
  }

  function agregarProcesoBloqueado(proceso) {
    colaBloqueados.push(proceso);
  }

  function crearProceso(nombre, rafaga) {
    var proceso = new Proceso();
    var tiempo = tiempoActual;
    var procesoAnterior = colaListos[colaListos.length - 1];
    var finalizacionAnterior = 0;

    if (tiempo > tiempoLlegada) {
      tiempoLlegada = tiempo;
    }

    proceso.nombre = nombre;
    proceso.rafaga = rafaga;
    proceso.llegada = tiempoLlegada++;

    if (typeof procesoAnterior === "object") {
      finalizacionAnterior = procesoAnterior.finalizacion;
    }

    proceso.finalizacion = rafaga + finalizacionAnterior;

    proceso.retorno = proceso.finalizacion - proceso.llegada;
    if (proceso.retorno < 0) proceso.retorno = 0;

    proceso.espera = proceso.retorno - proceso.rafaga;

    if (proceso.espera < 0) proceso.espera = 0;

    proceso.comienzo = proceso.espera + proceso.llegada;

    agregarProcesoListo(proceso);
    agregarColumnaListo(proceso);
    window.pintarProceso(proceso, colaListos.length);
  }

  function bloquearProceso(idProceso, fila) {
    var tiempo = tiempoActual;
    var proceso = colaListos[idProceso];
    if (tiempo < proceso.finalizacion && tiempo >= proceso.comienzo) {
      if (typeof fila !== "object") {
        fila = d3.select(".fila-proceso#proceso-" + idProceso);
      }

      d3.selectAll(".proceso-" + idProceso).classed("bloqueado", true);

      d3.select(".ejecucion.proceso-" + idProceso).attr(
        "width",
        (tiempo - proceso.comienzo) * rect.width
      );

      d3.select(".restante.proceso-" + idProceso)
        .attr("x", tiempo * rect.width)
        .attr("width", (proceso.finalizacion - tiempo) * rect.width);

      d3.select(".texto-restante.proceso-" + idProceso)
        .attr("x", tiempo * rect.width + 5)
        .text(proceso.finalizacion - tiempo);

      d3.select(".texto-rafaga.proceso-" + idProceso).text(
        tiempo - proceso.comienzo
      );

      proceso.nombre = proceso.nombre.replace("(Reanudado)", "");

      var rafagaTotal = proceso.rafaga;
      proceso.rafaga = proceso.finalizacion - tiempo;
      proceso.rafagaFaltante = proceso.finalizacion - tiempo;
      proceso.finalizacionTotal = proceso.finalizacion;

      proceso.bloqueado = tiempo;
      proceso.finalizacion = tiempo;
      agregarProcesoBloqueado(proceso);
      agregarColumnaBloqueados(proceso, rafagaTotal);

      var contenedor = document.getElementsByClassName("table-container")[1];
      contenedor.scrollTop = contenedor.scrollHeight;

      if (fila) {
        fila.remove();
      }

      colaListos[idProceso].rafaga = tiempo - proceso.comienzo;
      actualizarProcesos(idProceso);

      return colaBloqueados.length - 1;
    } else {
      swal({
        title: "Error!",
        text:
          "No se puede bloquear un proceso que no se encuentra en su sección critica",
        type: "error",
        confirmButtonText: "OK"
      });
    }
  }

  function actualizarProcesos(idProceso) {
    var longitudCola = colaListos.length;
    for (var i = Number(idProceso) + 1; i < longitudCola; i++) {
      var procesoAnterior = colaListos[i - 1];
      var finalizacionAnterior = 0;

      if (typeof procesoAnterior === "object") {
        finalizacionAnterior = procesoAnterior.finalizacion;
      }

      colaListos[i].finalizacion = colaListos[i].rafaga + finalizacionAnterior;

      colaListos[i].retorno =
        colaListos[i].finalizacion - colaListos[i].llegada;
      if (colaListos[i].retorno < 0) {
        colaListos[i].retorno = 0;
      }
      colaListos[i].espera = colaListos[i].retorno - colaListos[i].rafaga;
      if (colaListos[i].espera < 0) {
        colaListos[i].espera = 0;
      }
      colaListos[i].comienzo = colaListos[i].espera + colaListos[i].llegada;

      actualizarColumnaListos(i, colaListos[i]);
      actualizarGantt(i, colaListos[i]);
    }
  }

  function actualizarColumnaListos(id, proceso) {
    var tr = d3.select("#proceso-" + id).selectAll("td");
    var columnaComienzo = tr[0][3];
    var columnaFinalizacion = tr[0][4];
    var columnaRetorno = tr[0][5];
    var columnaEspera = tr[0][6];

    d3.select(columnaComienzo).text(proceso.comienzo);

    d3.select(columnaFinalizacion).text(proceso.finalizacion);

    d3.select(columnaRetorno).text(proceso.retorno);

    d3.select(columnaEspera).text(proceso.espera);
  }

  function actualizarGantt(id, proceso) {
    d3.select(".ejecucion.proceso-" + id)
      .attr("x", proceso.comienzo * rect.width)
      .attr("width", proceso.rafaga * rect.width);

    if (proceso.espera > 0) {
      d3.select(".espera.proceso-" + id)
        .attr("x", proceso.llegada * rect.width)
        .attr("width", proceso.espera * rect.width);

      d3.select(".texto-espera.proceso-" + id)
        .attr("x", proceso.llegada * rect.width + 5)
        .text(proceso.espera);
    } else {
      d3.select(".espera.proceso-" + id)
        .attr("x", proceso.llegada * rect.width)
        .attr("width", 0);

      d3.select(".texto-espera.proceso-" + id)
        .attr("x", proceso.llegada * rect.width + 5)
        .text("");
    }

    d3.select(".texto-rafaga.proceso-" + id)
      .attr("x", proceso.comienzo * rect.width + 5)
      .text(proceso.rafaga);
  }

  function crearPrimerProceso() {
    var nombreInicial = "Proceso " + numeroProcesos++;
    var rafagaInicial = 8;
    crearProceso(nombreInicial, rafagaInicial);
  }

  function generarProceso() {
    var nombre = "Proceso " + numeroProcesos++;
    var rafaga = Math.floor(Math.random() * constantes.RAFAGA_RANDOM + 1);
    crearProceso(nombre, rafaga);
  }

  function agregarColumnaListo(proceso) {
    var tabla = d3.select("#tabla_procesos");
    var tbody = tabla.select("tbody");

    var fila = tbody
      .append("tr")
      .attr("class", "fila-proceso")
      .attr("id", "proceso-" + (colaListos.length - 1));

    fila.append("td").text(proceso.nombre);

    fila.append("td").text(proceso.llegada);

    fila.append("td").text(proceso.rafaga);

    fila.append("td").text(proceso.comienzo);

    fila.append("td").text(proceso.finalizacion);

    fila.append("td").text(proceso.retorno);

    fila.append("td").text(proceso.espera);

    fila
      .append("td")
      .html(
        '<button type="button" class="btn btn-danger" title="Bloquear proceso"><span class="glyphicon glyphicon-pause" aria-hidden="true"></span></button>'
      )
      .on("click", function() {
        if (!pausado) {
          var filaActual = this.parentNode;
          var idProceso = filaActual.id.replace("proceso-", "");

          bloquearProceso(idProceso, filaActual);
        } else {
          swal({
            title: "Error!",
            text: "Reanude la ejecución para bloquear un proceso",
            type: "error",
            confirmButtonText: "OK"
          });
        }
      });
  }

  function agregarColumnaBloqueados(proceso, rafagaTotal) {
    var tabla = d3.select("#tabla_bloqueados");
    var tbody = tabla.select("tbody");

    var fila = tbody
      .append("tr")
      .attr("class", "fila-bloqueado")
      .attr("id", "proceso-" + (colaBloqueados.length - 1));

    fila.append("td").text(proceso.nombre);

    fila.append("td").text(proceso.bloqueado);

    fila.append("td").text(rafagaTotal);

    fila
      .append("td")
      .html(
        '<button type="button" class="btn btn-success" title="Reanudar proceso"><span class="glyphicon glyphicon-play" aria-hidden="true"></span></button>'
      )
      .on("click", function() {
        if (!pausado) {
          var filaActual = this.parentNode;
          var idProceso = filaActual.id.replace("proceso-", "");

          reanudarProceso(idProceso, filaActual);
        } else {
          swal({
            title: "Error!",
            text: "Reanude la ejecución para reanudar un proceso",
            type: "error",
            confirmButtonText: "OK"
          });
        }
      });
  }

  function reanudarProceso(idProceso, fila) {
    if (typeof fila !== "object") {
      fila = d3.select(".fila-bloqueado#proceso-" + idProceso);
    }

    var proceso = new Proceso();

    proceso.rafaga = colaBloqueados[idProceso].rafagaFaltante;
    proceso.nombre = colaBloqueados[idProceso].nombre + " (Reanudado)";

    crearProceso(proceso.nombre, proceso.rafaga);
    if (fila) {
      fila.remove();
    }
  }

  function validarProcesoEjecucion() {
    var tiempo = tiempoActual;
    var longitudCola = colaListos.length;
    for (
      var indexProceso = procesoActual;
      indexProceso < longitudCola;
      indexProceso++
    ) {
      var procesoInterno = colaListos[indexProceso];
      if (
        procesoInterno.comienzo <= tiempo &&
        procesoInterno.finalizacion > tiempo
      ) {
        d3.selectAll(".ejecutandose").classed("ejecutandose", false);

        d3.select(".fila-proceso#proceso-" + indexProceso).classed(
          "ejecutandose",
          true
        );

        d3.select(".ejecucion.proceso-" + indexProceso).classed(
          "ejecutandose",
          true
        );

        procesoActual = indexProceso;

        d3.select("#proceso_ejecucion").text(procesoInterno.nombre);
        d3.select("#rafaga_proceso").text(procesoInterno.rafaga);
        d3.select("#tiempo_restante").text(
          procesoInterno.finalizacion - tiempo
        );
      }
    }
  }

  Main.prototype.ejecutar = function() {
    crearPrimerProceso();

    for (var index = 0; index < constantes.PROCESOS_INICIALES; index++) {
      generarProceso();
    }

    timerAgregarProceso = window.setInterval(function() {
      generarProceso();
    }, constantes.TIEMPO_ESPERA);

    timerValidarProceso = window.setInterval(function() {
      d3.select("#tiempo_actual").text(++tiempoActual);

      validarProcesoEjecucion();
    }, 1000);

    d3.select(".btn-add").on("click", function() {
      generarProceso();
    });

    var toggleBtn = d3.select("#toggle-play").on("click", function() {
      if (toggleBtn.classed("pause-btn")) {
        clearInterval(timerAgregarProceso);
        clearInterval(timerValidarProceso);
        toggleBtn
          .html(
            '<span class="glyphicon glyphicon-play" aria-hidden="true"></span> Reanudar ejecución'
          )
          .attr("class", "btn btn-success play-btn");

        pausado = true;
      } else if (toggleBtn.classed("play-btn")) {
        timerAgregarProceso = window.setInterval(function() {
          generarProceso();
        }, constantes.TIEMPO_ESPERA);

        timerValidarProceso = window.setInterval(function() {
          d3.select("#tiempo_actual").text(++tiempoActual);

          validarProcesoEjecucion();
        }, 1000);

        toggleBtn
          .html(
            '<span class="glyphicon glyphicon-pause" aria-hidden="true"></span> Pausar ejecución'
          )
          .attr("class", "btn btn-danger pause-btn");

        pausado = false;
      }
    });
  };

  // Ejecución de funciones
  var main = new Main();
  main.ejecutar();
})();
