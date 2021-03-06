(function (context) {
  "use strict";

  var TheGraph = context.TheGraph;

  // Initialize configuration for the Port view.
  TheGraph.config.port = {
    container: {
      className: "port arrow"
    },
    backgroundCircle: {
      className: "port-circle-bg"
    },
    arc: {
      className: "port-arc"
    },
    innerCircle: {
      ref: "circleSmall"
    },
    text: {
      ref: "label",
      className: "port-label drag"
    }
  };

  TheGraph.factories.port = {
    createPortGroup: TheGraph.factories.createGroup,
    createPortBackgroundCircle: TheGraph.factories.createCircle,
    createPortArc: TheGraph.factories.createPath,
    createPortInnerCircle: TheGraph.factories.createCircle,
    createPortLabelText: TheGraph.factories.createText
  };

  // Port view

  TheGraph.Port = React.createFactory( React.createClass({
    displayName: "TheGraphPort",
    mixins: [
      TheGraph.mixins.Tooltip
    ],
    componentDidMount: function () {
      // Preview edge start
      this.getDOMNode().addEventListener("tap", this.edgeStart);
      this.getDOMNode().addEventListener("trackstart", this.edgeStart);
      // Make edge
      this.getDOMNode().addEventListener("trackend", this.triggerDropOnTarget);
      this.getDOMNode().addEventListener("the-graph-edge-drop", this.edgeStart);

      /*
      * RESTRICTION:
      * The only option in a portr is "EXPORT" and we don't want that
      * therefore, we drop this option
      */
      // Show context menu
      // if (this.props.showContext) {
      //  this.getDOMNode().addEventListener("contextmenu", this.showContext);
      //  this.getDOMNode().addEventListener("hold", this.showContext);
      // }
    },
    getTooltipTrigger: function () {
      return this.getDOMNode();
    },
    shouldShowTooltip: function () {
      return (
        this.props.app.state.scale < TheGraph.zbpBig ||
        this.props.label.length > 8
      );
    },
    showContext: function (event) {
      // Don't show port menu on export node port
      if (this.props.isExport) {
        return;
      }
      // Click on label, pass context menu to node
      if (event && (event.target === this.refs.label.getDOMNode())) {
        return;
      }
      // Don't show native context menu
      event.preventDefault();

      // Don't tap graph on hold event
      event.stopPropagation();
      if (event.preventTap) { event.preventTap(); }

      // Get mouse position
      var x = event.x || event.clientX || 0;
      var y = event.y || event.clientY || 0;

      // App.showContext
      this.props.showContext({
        element: this,
        type: (this.props.isIn ? "nodeInport" : "nodeOutport"),
        x: x,
        y: y,
        graph: this.props.graph,
        itemKey: this.props.label,
        item: this.props.port
      });
    },
    getContext: function (menu, options, hide) {
      return TheGraph.Menu({
        menu: menu,
        options: options,
        label: this.props.label,
        triggerHideContext: hide
      });
    },
    edgeStart: function (event) {
      // Don't start edge on export node port
      if (this.props.isExport) {
        return;
      }
      /*
      * FOEHN-RESTRICTION:
      * If it is a (inbound) port and there is already a link,
      * we can't create a new one
      */
      var graph = this.props.graph;
      for (var i in graph.edges) {
        var edge = graph.edges[i];
        if ((( this.props.port.port == edge.from.port ) && ( this.props.port.process == edge.from.node ))) {
          return;
        }
      }

      // Click on label, pass context menu to node
      if (event && (event.target === this.refs.label.getDOMNode())) {
        return;
      }
      // Don't tap graph
      event.stopPropagation();

      var edgeStartEvent = new CustomEvent('the-graph-edge-start', {
        detail: {
          isIn: this.props.isIn,
          port: this.props.port,
          // process: this.props.processKey,
          route: this.props.route
        },
        bubbles: true
      });
      this.getDOMNode().dispatchEvent(edgeStartEvent);
    },
    triggerDropOnTarget: function (event) {
      // If dropped on a child element will bubble up to port
      if (!event.relatedTarget) { return; }
      var dropEvent = new CustomEvent('the-graph-edge-drop', {
        detail: null,
        bubbles: true
      });
      event.relatedTarget.dispatchEvent(dropEvent);
    },
    render: function() {

      var nodeName = this.props.node.component;
      if (!isNaN(nodeName.substring(nodeName.length-2,nodeName.length)) ) {
          nodeName = nodeName.substring(0,nodeName.length-2);
      };
      var DdiBlock = ['ddi'];
      var ConditionalBlocks = ['schedule', 'ivr'];
      var EntityBlocks = [
          'device', 'user', 'directory', 'queue', 'conference', 'vmail',
          'callfwd', 'hangup'
      ];
      var CustomizableBlocks = [
        'setcallerid', 'script', 'playback', 'pilot', 'moh'];
      var nodeType = 'base';
      if (ConditionalBlocks.indexOf(nodeName) >= 0) {
          nodeType = 'primary';
      } else if (EntityBlocks.indexOf(nodeName) >= 0) {
          nodeType = 'secondary';
      }   else if (CustomizableBlocks.indexOf(nodeName) >= 0) {
        nodeType = 'third';
      };
      var classAttached = {
         container: "port arrow",
         backgroundCircle: "port-circle-bg",
         arc: "port-" + nodeType + "-arc",
         innerCircle: "circleSmall",
         text: "port-" + nodeType + "-label drag"
      };
      for (var prop in classAttached) {
          if (TheGraph.config.port[prop].className) {
              TheGraph.config.port[prop].className = classAttached[prop];
          };
      };

      var style;
      if (this.props.label.length > 7) {
        var fontSize = 6 * (30 / (4 * this.props.label.length));
        style = { 'fontSize': fontSize+'px' };
      }
      var r = 4;
      // Highlight matching ports
      var highlightPort = this.props.highlightPort;
      var inArc = TheGraph.arcs.inport;
      var outArc = TheGraph.arcs.outport;
      if (highlightPort && highlightPort.isIn === this.props.isIn && highlightPort.type === this.props.port.type) {
        r = 6;
        inArc = TheGraph.arcs.inportBig;
        outArc = TheGraph.arcs.outportBig;
      }

      var backgroundCircleOptions = TheGraph.merge(TheGraph.config.port.backgroundCircle, { r: r + 1 });
      var backgroundCircle = TheGraph.factories.port.createPortBackgroundCircle.call(this, backgroundCircleOptions);

      var arcOptions = TheGraph.merge(TheGraph.config.port.arc, { d: (this.props.isIn ? inArc : outArc) });
      var arc = TheGraph.factories.port.createPortArc.call(this, arcOptions);

      var innerCircleOptions = {
        className: "port-circle-small fill route"+this.props.route,
        r: r - 1.5
      };

      innerCircleOptions = TheGraph.merge(TheGraph.config.port.innerCircle, innerCircleOptions);
      var innerCircle = TheGraph.factories.port.createPortInnerCircle.call(this, innerCircleOptions);

      var labelTextOptions = {
        x: (this.props.isIn ? 5 : -5),
        style: style,
        children: this.props.label
      };
      labelTextOptions = TheGraph.merge(TheGraph.config.port.text, labelTextOptions);
      var labelText = TheGraph.factories.port.createPortLabelText.call(this, labelTextOptions);

      var portContents = [
        backgroundCircle,
        arc,
        innerCircle,
        labelText
      ];

      var containerOptions = TheGraph.merge(TheGraph.config.port.container, { title: this.props.label, transform: "translate("+this.props.x+","+this.props.y+")" });
      return TheGraph.factories.port.createPortGroup.call(this, containerOptions, portContents);

    }
  }));


})(this);
