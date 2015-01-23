var ratioScale = d3.scale.log().base(2).domain([0.3, 10]);
var medianIncomeScale = d3.scale.linear().domain([0,250000]);

// the rider scale gets a range because really, this won't be changing much
var ridersScale = d3.scale.log().domain([100,250000]).range([1,10]);

function scaleWithValue(scale, value) {
  return function(d) { return scale(d[value]); };
}

var mainFsm = new machina.Fsm({
  padding : 20,
  initialize : function() {
    var self = this;
    d3.csv('/data/metrocard-usage.csv', function(data) {
      _.map(data, function(d) {
        return _.extend(d, {
          borough : d.pretty_census_tract.split(',')[0]
        });
      });

      self.data = data;
      self.transition('setup');
    });

    this.theater = d3.select('#theater');
    this.svgElement = this.theater.node();
  },
  updateDimensions : function() {
    var svgBBox = this.svgElement.getBoundingClientRect();
    this.width = svgBBox.width;
    this.height = svgBBox.height;
  },

  'initialState' : 'loading',

  states : {
    loading : {
      // not much to see here
    },
    setup : {
      _onEnter : function() {
        this.stations = this.theater.selectAll('circle.station')
          .data(this.data);

        this.stations.enter().append('svg:circle')
          .classed('station', true)
          .each(function(d) {
            // you can't dynamically set the class name with class, so
            // we resort to this
            d3.select(this).classed(d.borough.toLowerCase(), true);
          })
          .attr('r', scaleWithValue(ridersScale, 'daily_riders') )
          .attr('cx', 10)
          .attr('cy', 10)
          .on('mouseenter', function(d) {
            console.log(d);
          });

        this.transition('scatter');
      }
    },
    scatter : {
      _onEnter : function() {
        this.updateDimensions();

        var xScale = ratioScale.copy().range([this.padding,this.width - this.padding]);
        var yScale = medianIncomeScale.copy().range([this.height - this.padding, this.padding]);
        
        this.stations.attr('cx', scaleWithValue(xScale, '30day_7day_ratio') )
          .attr('cy', scaleWithValue(yScale, 'median_household_income') )
          .attr('r', scaleWithValue(ridersScale, 'daily_riders') );
      }
    }
  }
});
