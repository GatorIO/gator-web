/**
*   Reporting functions
*/
var runningQueries = 0;
var ALL_SEGMENT = '-1000';

function Report(pageOptions) {

    //  Options specific to the page calling the report, like the projectId, timezone, and HTML elements to target.  These
    //  are not persisted.
    this.pageOptions = pageOptions || {};
    this.dataTablesObject = null;
    this.currentType = null;
    this.nextClause = null;

    //  The report configuration options and the UI state (selected series, sort order, etc.).  This is what should be persisted on a push state call.
    this.state = {
        key: null,      //  the definition key for the report
        map: null,
        view: null,     //  the data view (sessions, events, users or pages)
        isLog: null,    //  if it's a log report, don't group results
        title: null,
        renderView: null,
        dateStart: null,
        dateEnd: null,
        dateLabel: Toolbar.dateLabel,
        dateInterval: null,
        attributes: null,
        group: null,
        sort: null,
        segments: null,
        filter: null,
        customSegments: null,
        customCount: null,
        tableOrder: null,
        plotKeys: null,
        pageLength: null,
        eventSteps: null,
        activeStep: null
    };

    //  The data used to populate the table
    this.tableData = null;

    //  The data used to populate the chart - if there is no element grouping, this is the same as tableResult
    this.chartData = null;
    this.plotRows = [];

    this.colors = [
        { color: "#1cb14f", highlight: "#1cb14f" },
        { color: "#00aeef", highlight: "#00aeef" },
        { color: "rgba(248,172,89,0.8)", highlight: "rgba(248,172,89,1)" },
        { color: "rgba(172,148,198,0.8)", highlight: "rgba(172,148,198,1)" },
        { color: "rgba(228,30,66,0.7)", highlight: "rgba(228,30,66,.9)" },
        { color: "#7ea7b5", highlight: "#475188" },
        { color: "rgba(26,179,128,0.8)", highlight: "rgba(26,179,148,1)" },
        { color: "rgba(41,41,41,0.7)", highlight: "rgba(41,41,41,.9)" },
        { color: "rgba(30,65,155,0.8)", highlight: "rgba(30,65,155,1)" },
        { color: "rgba(242,229,88,0.8)", highlight: "rgba(242,229,88,1)" },
        { color: "rgba(99,99,99,0.7)", highlight: "rgba(99,99,99,.9)" },
        { color: "rgba(99,98,166,0.7)", highlight: "rgba(99,98,166,.9)" },
        { color: "rgba(228,30,66,0.4)", highlight: "rgba(228,30,66,.7)" },
        { color: "rgba(28,132,198,0.5)", highlight: "rgba(28,132,198,0.8)" },
        { color: "rgba(26,179,148,0.5)", highlight: "rgba(26,179,148,0.8)" }
    ];

    this.getColor = function(i) {
        return this.colors[i % this.colors.length];
    };

    this.run = function(callback) {

        try {

            //  if report is going from snapshot to timeline, only plot the first key to prevent excessive lines
            if (this.currentType == 'snapshot' && !this.snapshot()) {

                this.state.hiddenSeries = this.state.hiddenSeries || {};
                var found = false;

                for (c = 0; c < this.tableData.columns.length; c++) {
                    var metric = this.tableData.columns[c];

                    if (metric.isMetric) {

                        if (!this.state.hiddenSeries[metric.baseName] && !found)
                            found = true;
                        else
                            this.state.hiddenSeries[metric.baseName] = true;
                    }
                }
            }

            this.currentType = this.snapshot() ? 'snapshot' : 'timeline';

            var that = this, tableQuery;

            if (!this.pageOptions.apiUrl)
                this.pageOptions.apiUrl = '/query';

            if (!this.state.segments)
                this.state.segments = '-1000';   //  default to all sessions

            runningQueries++;
            Page.showLoading();

            //  If a hard-coded query is passed in, use it
            if (this.pageOptions.query)
                tableQuery = this.pageOptions.query;
            else
                tableQuery = this.getTableQuery();

            $.post(this.pageOptions.apiUrl, tableQuery, function(result) {
                runningQueries--;

                if (runningQueries <= 0)
                    Page.doneLoading();

                if (result.data) {

                    that.tableData = result.data;
                    that.chartData = result.data;

                    //  if grouping by an element, the chart will have a different query and result - get it now
                    if (!that.snapshot() && that.state.group && that.pageOptions.chartContainer) {

                        runningQueries++;
                        Page.showLoading();

                        $.post(that.pageOptions.apiUrl, that.getChartQuery(), function(result) {
                            runningQueries--;

                            if (runningQueries <= 0)
                                Page.doneLoading();

                            that.chartData = result.data;
                            that.consolidateDates(that.chartData);
                            that.render();

                            if (callback)
                                callback();
                        }, 'json').error(function(result) {
                            that.tableData = null;
                            that.chartData = null;

                            runningQueries--;
                            Page.doneLoading();

                            if (result && (result.status == 419 || result.status == 401)) {
                                window.location = '/login';
                            } else if (result && result.responseJSON && result.responseJSON.message) {
                                Page.alert('Error', result.responseJSON.message, 'error');
                            } else {
                                Page.alert('Error', 'Internal server error', 'error');
                            }

                            if (callback)
                                callback(new Error('Internal error'));
                        });
                    } else {
                        that.render();

                        if (callback)
                            callback();
                    }
                } else {
                    that.tableData = null;
                    that.chartData = null;

                    Page.showMessage('Internal server error');

                    if (callback)
                        callback(new Error('Internal error'));
                }
            }, 'json').error(function(result) {
                that.tableData = null;
                that.chartData = null;

                runningQueries--;
                Page.doneLoading();

                if (result && (result.status == 419 || result.status == 401)) {
                    window.location = '/login';
                } else if (result && result.responseJSON && result.responseJSON.message) {
                    Page.alert('Error', result.responseJSON.message, 'error');
                } else {
                    Page.alert('Error', 'Internal server error', 'error');
                }

                if (callback)
                    callback(new Error('Internal error'));
            });
        } catch(err) {

            if (callback)
                callback(err);
        }
    }
}

Report.prototype.columnEnum = function(data) {
    var val = {};

    for (var c = 0; c < data.columns.length; c++) {
        val[data.columns[c].name] = data.columns[c];
        val[data.columns[c].name]['index'] = c;

        val[c] = data.columns[c];
    }

    return val;
};

Report.prototype.getBaseQuery = function() {
    var state = this.state;

    var query = {
        view: state.view,
        projectId: this.pageOptions.projectId,
        timezone: this.pageOptions.timezone,
        attributes: state.attributes,
        timeframe: Toolbar.timeframe(state.dateLabel, state.dateStart, state.dateEnd)
    };

    if (state.eventSteps)
        query['eventSteps'] = state.eventSteps;

    if (state.sort)
        query['sort'] = state.sort;
    else
        query['sort'] = Toolbar.intervalAttribute(state.dateInterval);     //  default to sorting by time ranges if not grouping by element

    if (state.filter) {
        query['filter'] = state.filter;
    }

    if (this.nextClause) {
        query['nextClause'] = this.nextClause;
    }

    if (!state.isLog)
        query['group'] = Toolbar.intervalAttribute(state.dateInterval);

    var segments = [], segmentsArray = state.segments.split(',');

    for (var s = 0; s < segmentsArray.length; s++) {
        var segment = segmentsArray[s];

        if (segment.substr(0, 6) == 'custom') {
            segments.push({ name: state.customSegments[segment].text, query: state.customSegments[segment].query });
        } else {
            segments.push({ id: +segment });
        }
    }

    if (segments.length > 0)
        query.segments = segments;

    return query;
};

Report.prototype.download = function(format) {

    if (format == 'csv')
        window.location = '/download?format=' + format + '&query=' + encodeURIComponent(JSON.stringify(this.getTableQuery()));
    else
        window.location = '/download?' + window.location.search.substr(1) + '&format=' + format;
};

Report.prototype.getTableQuery = function() {
    var state = this.state;

    var query = this.getBaseQuery();

    if (state.isLog) {
        query.limit = 100;

        //  make sure coordinates are returned for map on log reports
        if (this.pageOptions.mapContainer) {

            if (query.attributes.indexOf('longitude') == -1)
                query.attributes += ',longitude';

            if (query.attributes.indexOf('latitude') == -1)
                query.attributes += ',latitude';
        }
    }

    if (!state.isLog && state.hasOwnProperty('group')) {
        query.group = state.group;

        query['sort'] = {};

        if (state.sort)
            query['sort'] = state.sort;
        else
            query['sort'][state.attributes.split(',')[0]] = -1;    }

    return query;
};

Report.prototype.getChartQuery = function() {
    var state = this.state, query = this.getBaseQuery(), pk, filter;

    query.group = Toolbar.intervalAttribute(state.dateInterval) + ',' + state.group;
    query.sort = query.group;

    if (state.group) {

        var $or = [], $in = [], plotKeys = state.plotKeys;

        if (!plotKeys) {
            plotKeys = this.getPlotKeys([0, 1, 2, 3]);    //  default to top 4 elements
        }

        //  for one element grouping, make a more efficient query using $in instead of $or
        if (state.group.split(',').length == 1) {

            for (pk = 0; pk < plotKeys.length; pk++) {

                if (typeof plotKeys[pk][state.group] != 'undefined')
                    $in.push(plotKeys[pk][state.group]);
            }

            if ($in.length > 0) {
                filter = {};
                filter[state.group] = { $in: $in };
            } else {
                filter = { sessionNumber: -1 };       // this is always false
            }
        } else {

            for (pk = 0; pk < plotKeys.length; pk++) {

                if (typeof plotKeys[pk] != 'undefined')
                    $or.push(plotKeys[pk]);
            }

            if ($or.length > 0)
                filter = { $or: $or };
            else
                filter = { sessionNumber: -1 };       // this is always false
        }

        //  if a filter has been created for plot keys, merge it with the existing filter, if it exists
        if (filter) {

            if (query.filter) {
                query.filter = { $and: [query.filter, filter ]}
            } else {
                query.filter = filter;
            }
        }
    }

    return query;
};

//  For a report with elements, consolidate the query on dates
Report.prototype.consolidateDates = function(data) {

    if (data.rows && data.rows.length > 0) {

        var columnEnum = this.columnEnum(data);
        var newRows = [], groupBys = this.groupByArray(data), key;
        var time = data.rows[0][groupBys[0]];
        var newRow = {}, newColumns = {};
        newRow[[groupBys[0]]] = data.rows[0][groupBys[0]];

        //  Build new columns
        newColumns[groupBys[0]] = Utils.clone(columnEnum[groupBys[0]]);

        //  Consolidate rows
        for (var r = 0; r < data.rows.length; r++) {
            var row = data.rows[r];

            if (time != row[groupBys[0]]) {
                newRows.push(newRow);

                newRow = {};
                newRow[[groupBys[0]]] = data.rows[r][groupBys[0]];
                time = row[groupBys[0]];
            }

            var prefix = [];

            for (var g = 1; g < groupBys.length; g++)
                prefix.push(this.dotValue(row, groupBys[g]));

            prefix = prefix.join('-');

            for (key in row) {

                if (row.hasOwnProperty(key) && groupBys.indexOf(key) == -1 && columnEnum[key]) {
                    var newColumn = Utils.clone(columnEnum[key]);
                    newColumn.baseName = newColumn.name;
                    newColumn.name = prefix + '-' + key;
                    newColumn.title = prefix + ': ' + newColumn.title;
                    delete newColumn.total;
                    delete newColumn.totalBy;

                    newColumns[newColumn.name] = newColumn;
                    newRow[newColumn.name] = row[key];
                }
            }
        }
        newRows.push(newRow);

        //  Rebuild columns for result
        data.columns = [];

        for (key in newColumns) {
            if (newColumns.hasOwnProperty(key)) {
                data.columns.push(newColumns[key]);
            }
        }

        data.query.group = groupBys[0];     //  restrict grouping to date
        data.rows = newRows;
    }
};

Report.dataTypes = [];
Report.dataTypes[Report.dataTypes["string"] = 0] = "string";
Report.dataTypes[Report.dataTypes["integer"] = 1] = "integer";
Report.dataTypes[Report.dataTypes["numeric"] = 2] = "numeric";
Report.dataTypes[Report.dataTypes["currency"] = 3] = "currency";
Report.dataTypes[Report.dataTypes["percent"] = 4] = "percent";
Report.dataTypes[Report.dataTypes["date"] = 5] = "date";
Report.dataTypes[Report.dataTypes["object"] = 6] = "object";
Report.dataTypes[Report.dataTypes["boolean"] = 7] = "boolean";
Report.dataTypes[Report.dataTypes["array"] = 8] = "array";

Report.prototype.render = function() {

    if (!this.tableData.rows || this.tableData.rows.length == 0)
        Page.showMessage('There is no data available for this query.');

    if (this.pageOptions.chartContainer)
        this.renderChart();

    if (this.pageOptions.tableContainer)
        this.renderTable();

    if (this.pageOptions.mapContainer)
        this.renderMap();

    //  clear nextClause so it doesn't become part of every query
    this.nextClause = null;

    Page.clearMessage();
};

//  Format the query's group by into an array
Report.prototype.groupByArray = function (data) {

    var groupBy = data.query.group;

    if (!Utils.isArray(groupBy))
        groupBy = groupBy.split(',');

    for (g = 0; g < groupBy.length; g++)
        groupBy[g] = groupBy[g].trim();

    return groupBy;
};

Report.prototype.snapshot = function () {

    if (this.state.dateLabel.substr(0, 4) == 'Last' || this.state.dateLabel.substr(0, 4) == 'This')
        return false;

    if (this.state.dateStart == this.state.dateEnd && (this.state.dateInterval == 'Daily' || this.state.dateInterval == 'Weekly' || this.state.dateInterval == 'Monthly'))
        return true;

    if ((this.state.dateLabel == 'This Month' || this.state.dateLabel == 'Last Month') && this.state.dateInterval == 'Monthly')
        return true;

    return false;
};

Report.prototype.renderChart = function () {

    if (this.chartData.rows.length > 1) {

        if (this.snapshot())
            this.renderSnapshot();
        else
            this.renderTimeline();
    } else {
        $('#' + this.pageOptions.chartContainer).html('');
    }
};

Report.prototype.renderTimeline = function () {

    var data = this.chartData, i, c, g, r, column, query = data.query, that = this, chartMetrics = [], state = this.state, colors = [];
    var datasets = [], groupBy = this.groupByArray(data), colorIndex = 0, chartData = [];
    var columnEnum = this.columnEnum(data);

    for (c = 0; c < data.columns.length; c++) {

        if (!data.columns[c].baseName)
            data.columns[c].baseName = data.columns[c].name;

        //  Hide 'All Sessions' column if user removed if from segments field
        if (this.visibleColumn(data.columns[c])) {
            if (data.columns[c].isMetric)
                chartMetrics.push({ name: data.columns[c].name, baseName: data.columns[c].baseName, max: data.columns[c].max, yaxis: null });
        }
    }

    //  Figure out axis groupings by metric max values
    var yaxes = [], ax, positionRight = false;

    //  Group max values of the same magnitude into the same axis
    for (c = 0; c < chartMetrics.length; c++) {

        if (!state.hiddenSeries || !state.hiddenSeries[chartMetrics[c].baseName]) {

            for (i = 0; i < yaxes.length; i++) {

                if (chartMetrics[c].max == 0 || (yaxes[i].dataMax / chartMetrics[c].max < 20 && yaxes[i].dataMax / chartMetrics[c].max > .05)) {
                    chartMetrics[c].yaxis = i + 1;
                    break;
                }
            }

            if (!chartMetrics[c].yaxis) {
                ax = { min: 0, dataMax: chartMetrics[c].max };

                if (positionRight)
                    ax.position = 'right';

                positionRight = !positionRight;

                yaxes.push(ax);
                chartMetrics[c].yaxis = yaxes.length;
            }
        }
    }

    for (c = 0; c < chartMetrics.length; c++) {
        var metric = chartMetrics[c];

        if (!this.state.hiddenSeries || !this.state.hiddenSeries[metric.baseName]) {
            colors.push(this.getColor(colorIndex).color);

            column = columnEnum[metric.name];

            if (column) {

                var dataset = {
                    label: column.title,
                    yaxis: metric.yaxis,
                    points: {show: true},
                    lines: {show: true},
                    data: []
                };

                for (i = 0; i < data.rows.length; i++) {
                    dataset.data.push([i, data.rows[i][column.name] || 0]);
                }

                datasets.push(dataset);
            }
        }
        colorIndex++;
    }

    var legendOptions = {
        show: false
    };

    //  show the legend if the element is specified in the pageOptions and it is a grouped report
    if (this.pageOptions.legendContainer)
        $('#' + this.pageOptions.legendContainer).html('');

    if (this.pageOptions.legendContainer && (!this.pageOptions.tableContainer || state.group))
        legendOptions = {
            show: true,
            container: '#' + this.pageOptions.legendContainer, noColumns: 6
        };

    var plotOptions, html = '<div id="' + this.pageOptions.chartContainer + '-container" class="flot-container">';

    html += '<div id="' + this.pageOptions.chartContainer + '-0" class="flot-placeholder"></div></div><div id="results-legend" style="width:100%;margin-top:10px"></div>';

    plotOptions = {
        yaxes: yaxes,
        yaxis: {
            tickFormatter: function (val, axis) {
                return val.toLocaleString();
            }
        },
        legend: legendOptions,
        colors: colors,
        grid: {
            clickable: true,
            tickColor: "#eee",
            borderWidth: 0,
            hoverable: true //IMPORTANT! this is needed for tooltip to work
        },
        xaxis: {
            minTickSize: 1,
            tickFormatter: function (val, axis) {

                if (data.rows[val]) {

                    var label = '';

                    for (g = 0; g < groupBy.length; g++)
                        label += data.rows[val][groupBy[g]] + ' / ';

                    label = label.substr(0, label.length - 3);
                    return label;
                } else {
                    return '';
                }
            }
        }
    };

    $('#' + this.pageOptions.chartContainer).html(html);

    var plot = $.plot(
        $('#' + this.pageOptions.chartContainer + '-0'),
        datasets,
        plotOptions
    );

    $('#' + this.pageOptions.chartContainer + '-container').resizable();

    $("<div id='chart-tooltip' class='chart-tooltip'></div>").appendTo("body");

    $('#' + this.pageOptions.chartContainer + '-0').unbind("plothover");
    $('#' + this.pageOptions.chartContainer + '-0').unbind("mouseout");

    $('#' + this.pageOptions.chartContainer + '-0').bind("mouseout", function (event, pos, item) {
        $("#chart-tooltip").hide();
    });

    $('#' + this.pageOptions.chartContainer + '-0').bind("plothover", function (event, pos, item) {

        if (item) {
            var tooltip = '<b>';

            for (g = 0; g < groupBy.length; g++)
                tooltip += data.rows[item.datapoint[0]][groupBy[g]] + ' / ';

            tooltip = tooltip.substr(0, tooltip.length - 3) + '</b><table>';
            colorIndex = 0;

            for (c = 0; c < chartMetrics.length; c++) {

                if (!state.hiddenSeries || !state.hiddenSeries[chartMetrics[c].baseName]) {

                    column = columnEnum[chartMetrics[c].name];
                    var total = column.total, pct = '';

                    if (column.hasOwnProperty('totalBy') && column.totalBy == 'sum') {

                        if (total) {
                            if (data.rows[item.datapoint[0]].hasOwnProperty(chartMetrics[c].name))
                                pct = ' (' + (data.rows[item.datapoint[0]][chartMetrics[c].name] / total * 100).toFixed(2) + '%)';
                            else
                                pct = ' (0.00%)';
                        }
                    }

                    tooltip += '<tr><td><span class="fa fa-square" style="color:' + that.getColor(colorIndex).highlight + '"></span>&nbsp; ' +
                        column.title + ':&nbsp; </td><td style="text-align:right">' +
                        Report.formatValue(data.rows[item.datapoint[0]][chartMetrics[c].name], column.dataType, column.format) + pct + '</td></tr>';
                }
                colorIndex++;
            }

            $("#chart-tooltip").html(tooltip + '</table>')
                .css({
                    top: item.pageY + 5,
                    left: item.pageX - 55 - (item.dataIndex + 1 > data.rows.length * .9 ? 100 * (item.dataIndex / data.rows.length) : 0)
                })
                .show();
        } else {
            $("#chart-tooltip").hide();
        }
    });
};

Report.prototype.renderSnapshot = function () {
    var i, g, data = this.tableData, chartMetrics = [], c, numCharts = 0, colors = [], state = this.state, datasets = [], groupBy = this.groupByArray(data);
    var plotOptions = [], chartType, maxCharts = 4;

    if (this.pageOptions.style == 'dashboard')
        maxCharts = 2;

    for (c = 0; c < data.columns.length && numCharts < maxCharts; c++) {

        if (!data.columns[c].baseName)
            data.columns[c].baseName = data.columns[c].name;

        //  Hide 'All Sessions' column if user removed if from segments field
        if (this.visibleColumn(data.columns[c])) {

            if (!state.hiddenSeries || !state.hiddenSeries[data.columns[c].baseName]) {

                if (data.columns[c].isMetric) {
                    numCharts++;
                    chartMetrics.push(data.columns[c]);
                }
            }
        }
    }

    for (c = 0; c < this.colors.length; c++)
        colors.push(this.getColor(c).color);

    var colSize = 12 / numCharts;
    var html = '<div class="row white-bg">';
    var barColorIndex = 0;

    for (c = 0; c < chartMetrics.length; c++) {
        var metric = chartMetrics[c];

        if (!this.state.hiddenSeries || !this.state.hiddenSeries[metric.baseName]) {
            html += '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-' + colSize + '"><h2 class="text-center">' + metric.title + '</h2>' +
                '<div class="flot-container flot-container-pie"><div id="' + this.pageOptions.chartContainer + '-' + c + '" class="flot-placeholder"></div></div>' +
                '</div>';

            chartType = metric.totalBy == 'sum' ? 'pie' : 'bar';
            var maxPoints = metric.totalBy == 'sum' ? 5 : 5;

            var dataset = [], ticks = [], subTotal = 0;

            for (i = 0; i < data.rows.length && i < maxPoints; i++) {

                var label = '', value = data.rows[i][metric.name] || 0;

                for (g = 0; g < groupBy.length; g++)
                    label += this.dotValue(data.rows[i], groupBy[g]) + ' / ';

                label = label.substr(0, label.length - 3);
                subTotal += value;

                if (label.length > 35)
                    label = label.substr(0, 32) + '...';

                if (chartType == 'pie') {

                    if (value != 0) {
                        dataset.push({ label: label, data: value });
                    }
                } else {
                    var index = data.rows.length - i - 1, barColor = this.getColor(0).color;
                    ticks.push([index, label]);

                    //  color score bars
                    if (metric.name == 'score') {

                        if (value <= 100)
                            barColor = 'red';
                        else if (value <= 300)
                            barColor = '#f0ed00';
                    }

                    dataset.push({ color: barColor, data: [[ value, index ]] });

                }
            }

            if (chartType == 'bar') {
                barColorIndex++;
            }

            //  if remaining unplotted data
            if (metric.total > subTotal && chartType == 'pie')
                dataset.push( { label: 'Other', data: metric.total - subTotal });

            //  if no data
            if (metric.total == 0 && chartType == 'pie')
                dataset.push( { label: 'No data', data: 1, color: '#ddd' });

            datasets.push(dataset);

            if (chartType == 'pie') {

                plotOptions.push({
                    legend: {
                        show: true,
                        labelFormatter: function (label, series) {

                            if (label == 'No data')
                                return 'No data';

                            return '<table><tr>' +
                                '<td style="width:29px;text-align:right;font-size:13px;padding:2px">' + Math.round(series.percent) + '%</td>' +
                                '<td style="text-align:right;font-size:13px;padding:2px;padding-left:5px">' + label + '</td>' +
                                '</tr></table>';
                        }
                    },
                    colors: colors,
                    grid: {
                        hoverable: true
                    },
                    series: {
                        pie: {
                            innerRadius: 0.7,
                            radius: .95,
                            show: true
                        }
                    }
                });
            } else {

                plotOptions.push({
                    legend: {
                        show: false
                    },
                    xaxis: {
                        show: true
                    },
                    yaxis: {
                        ticks: ticks,
                        axisLabelFontSizePixels: 13,
                        show: true,
                        tickLength: 0
                    },
                    grid: {
                        hoverable: true,
                        borderWidth: 1,
                        borderColor: '#aaa'
                    },
                    series: {
                        bars: {
                            show: true
                        }
                    },
                    bars: {
                        align: "center",
                        horizontal: true,
                        barWidth: .5,
                        lineWidth: 1
                    }
                });
            }
        }
    }

    html += '</div>';

    $('#' + this.pageOptions.chartContainer).html(html);
    $("<div id='chart-tooltip' class='chart-tooltip'></div>").appendTo("body");

    for (var plotNum = 0; plotNum < chartMetrics.length; plotNum++) {

        var plot = $.plot(
            $('#' + this.pageOptions.chartContainer + '-' + plotNum),
            datasets[plotNum],
            plotOptions[plotNum]
        );

        $('#' + this.pageOptions.chartContainer + '-' + plotNum).unbind("plothover");
        $('#' + this.pageOptions.chartContainer + '-' + plotNum).unbind("mouseout");

        $('#' + this.pageOptions.chartContainer + '-' + plotNum).bind("mouseout", function (event, pos, item) {
            $("#chart-tooltip").hide();
        });

        $('#' + this.pageOptions.chartContainer + '-' + plotNum).bind("plothover", function (event, pos, item) {

            if (item) {
                var tooltip;

                if (item.series.label) {        //  if pie
                    tooltip = item.series.label;

                    if (tooltip != 'No data') {
                        tooltip +=  ': ' + item.series.data[0][1];

                        if (item.series.hasOwnProperty('percent'))
                            tooltip += ' (' + Math.round(item.series.percent) + '%)';
                    }
                } else {                        //  bar

                    tooltip = item.series.yaxis.ticks[item.dataIndex].label + ': ' + item.datapoint[0];
                }

                $("#chart-tooltip").html(tooltip)
                    .css({
                        top: pos.pageY + 5,
                        left: pos.pageX - 55
                    })
                    .show();
            } else {
                $("#chart-tooltip").hide();
            }
        });
    }
};

//  Generic formatting for table cells.  These can be overridden on a column by column basis using the 'formatters' object.
Report.prototype.configureColumn = function(newCol, column) {
    var reportData = this.tableData, that = this;

    //  See if there is a formatter for this column.  If so, use it, otherwise do generic formatting.
    if (typeof this.formatters[column.name] == 'function') {

        newCol.render = function(data, type, row) {
            return that.formatters[column.name](data);
        };

        return;
    }

    switch (Report.dataTypes[column.dataType]) {

        case Report.dataTypes.string:
            newCol.render = function(data, type, row) {

                if (data && data.length > 100)
                    return data.substr(0, 97) + '<a href="#" onclick="return false" title="' + data + '">...</a>';
                else
                    return data;
            };
            break;
        case Report.dataTypes.array:
        case Report.dataTypes.object:
            newCol.render = function(data, type, row) {

                if (typeof data == 'string')
                    return data;
                else
                    return '<pre>' + (YAML ? YAML.stringify(data) : JSON.stringify(data, null, 4)) + '</pre>';
            };
            break;
        case Report.dataTypes.percent:
            newCol['className'] = 'dt-body-right';
            newCol.render = function(data, type, row) {
                return Report.formatValue(data, Report.dataTypes.percent, column.format);
            };
            break;
        case Report.dataTypes.integer:
        case Report.dataTypes.numeric:
        case Report.dataTypes.currency:
            newCol['className'] = 'dt-body-right';
            newCol.render = function(data, type, row, meta) {
                var colNo = meta.col - (that.plotKeysEnabled() ? 1 : 0);

                if (colNo < reportData.columns.length) {

                    if (reportData.columns[colNo].hasOwnProperty('totalBy') && reportData.columns[colNo].totalBy == 'sum') {
                        var total = reportData.columns[colNo].total;

                        if (total)
                            //  the hidden span is for sorting formatted cells
                            return '<span style="display:none">' + ('0000000000000' + data).slice(-13) + '</span>' + data.toLocaleString() +
                                '<div style="display:inline-block; font-size:.825em;font-weight:500;min-width:47px !important">&nbsp; (' + (data / total * 100).toFixed(2) + '%)</div>';
                        else
                            return Report.formatValue(data, Report.dataTypes[column.dataType], column.format);
                    } else {
                        return Report.formatValue(data, Report.dataTypes[column.dataType], column.format);
                    }
                }
            };
            break;
        case Report.dataTypes.date:
            newCol.render = function(data, type, row) {
                return Report.formatValue(data, Report.dataTypes.date, column.format);
            };
            break;
    }
};

Report.prototype.visibleColumn = function (column) {
    if (column.name == 'longitude' || column.name == 'latitude')
        return false;

    return (this.state.segments && this.state.segments.split(',').indexOf(ALL_SEGMENT) > -1) || !column.isMetric || column.fromSegment;
};

Report.prototype.plotKeysEnabled = function () {
    return !this.snapshot() && this.pageOptions.style != 'dashboard' && this.state.group && this.pageOptions.chartContainer;
};

Report.prototype.renderMap = function () {

    var data = this.tableData, that = this, rows = data.rows, columns = data.columns;
    var markers = [];

    for (r = 0; r < rows.length; r++) {

        var row = rows[r], tooltip = '<table class="map-tooltip">';

        for (var c = 0; c < columns.length; c++) {

            if (columns[c]['name'] != 'longitude' && columns[c]['name'] != 'latitude') {
                tooltip += '<tr><td>' + columns[c]['title'] + '</td><td>';

                if (typeof this.formatters[columns[c]['name']] == 'function')
                    tooltip += this.formatters[columns[c]['name']](this.dotValue(row, columns[c]['name']));
                else
                    tooltip += Report.formatValue(this.dotValue(row, columns[c]['name']), columns[c].dataType, columns[c].format);

                tooltip += '</td></tr>';
            }
        }
        tooltip += '</table>';

        if (row.longitude && row.latitude)
            markers.push({name: 'point', latLng: [row.latitude, row.longitude], tooltip: tooltip });
    }

    if (this.mapObject)
        this.mapObject.remove();

    $('#' + this.pageOptions.mapContainer).vectorMap({
        map: 'world_mill',
        markers: markers,
        markerStyle: {
            initial: {
                image: '/images/marker.png'
            }
        },
        backgroundColor: 'none',
        regionStyle: {
            initial: {
                fill: '#1cb14f',
                "fill-opacity": 1,
                stroke: 'none',
                "stroke-width": 0,
                "stroke-opacity": 1
            }
        },
        onMarkerTipShow: function(e, el, code){
            el.html(markers[code].tooltip);
            el.css('z-index', 10000);
        }
    });

    this.mapObject = $('#' + this.pageOptions.mapContainer).vectorMap('get', 'mapObject');
};

Report.prototype.renderTable = function () {

    var data = this.tableData, that = this, rows = data.rows, columns = data.columns;
    var g, i, e, r, s, o, newRow, pass, found, key, state = this.state;
    var tableId = this.pageOptions.tableContainer + '-table';
    var columnEnum = this.columnEnum(data);

    //  wipe out existing dataTables object if it already exists
    if (this.dataTablesObject) {
        this.dataTablesObject.DataTable().destroy();
        $('#' + tableId).empty();
    }

    $('#' + this.pageOptions.tableContainer).html('<table id="' + tableId + '" class="table table-striped table-bordered table-hover" style="width:100%; margin:0">' +
        '</table>');

    var attributes = Utils.isArray(data.query.attributes) ? data.query.attributes : data.query.attributes.split(',');
    var order = [], tableRows = [], tableCols = [], colorIndex = 0;

    var numVisibleCols = 0;

    //  plot refresh cell definition
    if (this.plotKeysEnabled()) {
        tableCols.push({
            title: '<span class="fa fa-refresh" style="font-size:1.3em; cursor:pointer" onclick="runQuery(); return false;"></span>',
            width: '18px',
            searchable: false,
            orderable: false,
            sClass: 'hidden-print'
        });
    }

    for (e = 0; e < columns.length; e++) {

        var data_color, col = columns[e];

        //  Hide 'All Sessions' column if user removed if from segments field
        if (this.visibleColumn(col)) {
            numVisibleCols++;

            var newCol = {
                title: '<span title="' + col.description + '">' + col.title + '</span>'
            };

            //  Make metric columns toggle-able (unless grouping)
            if (this.pageOptions.style != 'dashboard') {

                if (col.isMetric) {

                    if (state.group)
                        data_color = '#aaa';
                    else
                        data_color = this.getColor(colorIndex++).color;

                    var icon = this.state.hiddenSeries && this.state.hiddenSeries[col.name] ? 'fa-square-o' : 'fa-check-square';
                    var stateColor = this.state.hiddenSeries && this.state.hiddenSeries[col.name] ? '#888' : data_color;

                    if (this.pageOptions.chartContainer)
                        newCol.title = '<span id="column-toggle-' + this.pageOptions.tableContainer + '-' + col.name + '" data-color="' + data_color + '" data-column="' + col.name + '" ' +
                            'title="Toggle chart display" class="hidden-print column-toggle fa ' + icon + '" style="width:18px; position:relative; top:1px; font-size:1.3em; color:' +
                            stateColor + '"></span> ' + newCol.title;
                }
            }

            if (col.hasOwnProperty('total')) {
                var formattedTotal;

                if (typeof this.formatters[col.name] == 'function')
                    formattedTotal = this.formatters[col.name](col.total);
                else
                    formattedTotal = Report.formatValue(col.total, col.dataType, col.format);

                newCol.title += ' <br><div style="font-weight:500;font-size:1.4em;padding-top:3px">' + formattedTotal;

                //  If this is from a segment, add the percentage to the header
                if (col.baseColumnName) {

                    var baseCol = columnEnum[col.baseColumnName];

                    if (baseCol.total && baseCol.totalBy == 'sum') {
                        newCol.title += '<div style="display:inline-block; font-size:.7em;font-weight:500;min-width:47px !important">&nbsp; (' +
                            (col.total / baseCol.total * 100).toFixed(2) + '% of ' + baseCol.title + ')</div>';
                    }
                } else if (col.basis && col.totalBy == 'sum' && col.basis != col.total) {

                    //  If this has a basis total, show it
                    newCol.title += '<div style="display:inline-block; font-size:.7em;font-weight:500;min-width:47px !important">&nbsp; (';

                    if (col.basisRelationship == 'ratio')
                        newCol.title += (col.total / col.basis).toFixed(2) + ' per ' + col.basisColumnTitle + ')</div>';
                    else
                        newCol.title += (col.total / col.basis * 100).toFixed(2) + '% of ' + col.basisColumnTitle + ')</div>';

                }

                newCol.title += '</div>';
            }
            this.configureColumn(newCol, col);
            tableCols.push(newCol);

            //  if the ordering was not part of the state, check for sorting on the query and use that
            if (order.length == 0) {

                for (key in data.query.sort) {

                    if (data.query.sort.hasOwnProperty(key)) {

                        if (key == col.name)
                            order.push([e + (this.plotKeysEnabled() ? 1 : 0), data.query.sort[key] == -1 ? "desc" : "asc"]);
                    }
                }
            }
        }
    }

    //  make sure ordering column exists
    if (state.tableOrder && state.tableOrder.length) {

        for (var t = 0; t < state.tableOrder.length; t++) {

            if (state.tableOrder[t] > numVisibleCols) {
                delete state.tableOrder;        //  ordering is off table, so kill it
                break;
            }
        }
    }

    if (state.tableOrder)
        order = Utils.clone(state.tableOrder);

    //  Add rows to output
    for (r = 0; r < rows.length; r++) {
        newRow = [];

        //  add plot key selection checkbox
        if (this.plotKeysEnabled()) {

            var rowIcon = 'fa-square-o', rowColor = '#888';

            //  See if row should be marked as plotted
            if (state.plotKeys) {

                for (var pk = 0; pk < state.plotKeys.length; pk++) {

                    if (Utils.isEqual(this.getKey(r), state.plotKeys[pk])) {
                        rowIcon = 'fa-check-square';
                        rowColor = '#1cb14f';

                        if (this.plotRows.indexOf(r) == -1)
                            this.plotRows.push(r);
                    }
                }
            }

            newRow.push('<span id="row-toggle-' + r + '" data-row="' + r + '" ' +
                'title="Toggle chart display" class="row-toggle fa ' + rowIcon + '" style="width:18px; position:relative;top:1px;left:2px;font-size:1.3em;color:' + rowColor + '"></span>');
        }

        for (e = 0; e < columns.length; e++) {

            if (this.visibleColumn(columns[e])) {

                if (!this.propertyExists(rows[r], columns[e].name)) {

                    if (!columns[e].isMetric && columns[e].dataType != 'numeric' && columns[e].dataType != 'integer' && columns[e].dataType != 'currency') {
                        newRow.push('');
                    } else {
                        newRow.push(0);
                    }
                } else {
                    newRow.push(this.dotValue(rows[r], columns[e].name));
                }
            }
        }
        tableRows.push(newRow);
    }

    if (!order)
        order = [[this.plotKeysEnabled() ? 2 : 1, 'asc']];

    //  check if any ordering is off table, since it causes an exception
    for (i = 0; i < order.length; i++) {

        if (order[i][0] >= tableCols.length) {
            order = [];
            break;
        }
    }

    $('#' + this.pageOptions.tableContainer + '-container').css('visibility', 'visible');

    var dom = 'lfrtip';

    if (this.pageOptions.style == 'dashboard') {
        dom = 't';
        state.pageLength = 5;
    }

    this.dataTablesObject = $('#' + tableId).dataTable({
        order: order,
        data: tableRows,
        columns: tableCols,
        lengthMenu: [ 10, 25, 50, 100, 1000 ],
        pageLength: state.pageLength || 10,
        dom: dom,
        responsive: true
    }).on('order.dt', function () {
        that.state.tableOrder = Utils.clone($('#' + tableId).DataTable().order());

        if (typeof that.pageOptions.onStateChange == 'function')
            that.pageOptions.onStateChange();
    }).on('draw.dt', function () {
        that.setupRowToggles();
    }).on('length.dt', function (e, settings, len) {
        that.state.pageLength = len;

        if (typeof that.pageOptions.onStateChange == 'function')
            that.pageOptions.onStateChange();
    });
    this.setupRowToggles();

    //  unbind click handlers
    $('.column-toggle').unbind('click');

    //  add toggle event handlers after creating dataTable
    $('.column-toggle').click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        //  set flag to show/hide series
        var colName = e.target.dataset.column;

        if (state.hiddenSeries && state.hiddenSeries[colName]) {
            delete state.hiddenSeries[colName];
            $('#' + e.target.id).removeClass('fa-square-o');
            $('#' + e.target.id).addClass('fa-check-square');
            $('#' + e.target.id).css('color', $('#' + e.target.id).attr('data-color'));
        } else {
            if (!state.hiddenSeries)
                state.hiddenSeries = {};

            state.hiddenSeries[colName] = true;
            $('#' + e.target.id).removeClass('fa-check-square');
            $('#' + e.target.id).addClass('fa-square-o');
            $('#' + e.target.id).css('color', '#888');
        }

        that.renderChart();

        if (typeof that.pageOptions.onStateChange == 'function')
            that.pageOptions.onStateChange();
    });

    /*  Hide elements when printing  */
    $('#' + tableId + '_length').addClass('hidden-print');
    $('[name="' + tableId + '_length"]').removeClass('form-control');
    $('#' + tableId + '_filter').addClass('hidden-print');
    $('#' + tableId + '_paginate').addClass('hidden-print');

    if (data.nextClause && this.pageOptions.style != 'dashboard') {
        $('#' + this.pageOptions.tableContainer).append('<div class="hidden-print">' +
            '<a href="#" onclick="report.nextClause = report.tableData.nextClause; runQuery(); return false">Show more...</a>' +
            '</div>');
    }
};

//  get the value of an attribute from a attribute name that may contain a dot (like event.firstName)
Report.prototype.dotValue = function(obj, str) {

    if (!obj)
        return null;

    if (str.indexOf('.') == -1)
        return obj[str];

    str = str.split(".");

    for (var i = 0; i < str.length; i++) {
        obj = obj[str[i]];

        if (typeof obj == 'undefined')
            return null;
    }

    return obj;
};

Report.prototype.propertyExists = function(row, name) {

    if (name.indexOf('.') > -1)
        return this.dotValue(row, name) ? true : false;
    else
        return row.hasOwnProperty(name);

};

Report.prototype.setupRowToggles = function() {
    var that = this;

    $('.row-toggle').unbind('click');

    $('.row-toggle').click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        //  set flag to show/hide plot keys
        var row = +e.target.dataset.row;

        if (that.plotRows.indexOf(row) == -1) {
            that.plotRows.push(row);

            $('#' + e.target.id).removeClass('fa-square-o');
            $('#' + e.target.id).addClass('fa-check-square');
            $('#' + e.target.id).css('color', '#1cb14f');
        } else {

            that.plotRows.splice(that.plotRows.indexOf(row), 1);

            $('#' + e.target.id).removeClass('fa-check-square');
            $('#' + e.target.id).addClass('fa-square-o');
            $('#' + e.target.id).css('color', '#888');
        }

        that.state.plotKeys = that.getPlotKeys(that.plotRows);

        that.renderChart();

        if (typeof that.pageOptions.onStateChange == 'function')
            that.pageOptions.onStateChange();
    });
};

//  Return the key (based on the group by) for the row
Report.prototype.getKey = function(row) {
    var groupBy = this.groupByArray(this.tableData), key = {};

    for (var g = 0; g < groupBy.length; g++) {

        //  if codes exist for the values, use them
        if (this.tableData.codes && this.tableData.codes[row] && this.tableData.codes[row][groupBy[g]])
            key[groupBy[g]] = this.tableData.codes[row][groupBy[g]];
        else
            key[groupBy[g]] = this.dotValue(this.tableData.rows[row], groupBy[g]);
    }

    return key;
};

//  Return the currently selected plot keys on the table
Report.prototype.getPlotKeys = function(rows) {
    var keys = [], useRows = rows;

    if (useRows.length == 0)
        useRows = [0, 1, 2, 3, 4];

    for (var row = 0; row < useRows.length; row++) {

        if (this.tableData.rows[row])
            keys.push(this.getKey(useRows[row]));
    }

    return keys;
};


//  Set the plot keys on the table based on state
Report.prototype.setPlotKeys = function() {
    var rows = this.tableData.rows, keys = this.state.plotKeys;

    if (!keys && keys.length == 0 || !rows || rows.length == 0)
        return;

    for (var row = 0; row < rows.length; row++) {
        keys.push(this.getKey(rows[row]));
    }

    return keys;
};

//  Turn a JSON query object into a string that is more readable
Report.explainQuery = function(json) {
    var text;

    if (typeof json == 'string')
        json = eval('(' + json + ')');

    if (json['$and'] && json['$and'].length == 1)
        json = json['$and'][0];

    if (json['$or'] && json['$or'].length == 1)
        json = json['$or'][0];

    text = JSON.stringify(json);

    text = Utils.replaceAll(text, '\\$', '');
    text = Utils.replaceAll(text, '{', '');
    text = Utils.replaceAll(text, '}', '');
    text = Utils.replaceAll(text, ':', ': ');
    return '<pre>' + text + '</pre>';
};

Report.formatValue = function(value, dataType, format) {

    switch (Report.dataTypes[dataType]) {
        case Report.dataTypes.object:
        case "object":

            if (value == undefined)
                return '(not set)';

            return JSON.stringify(value, null, 4);

            break;
        case Report.dataTypes.percent:
        case "percent":

            if (value == undefined || value == null)
                return '0.00%';

            if (Utils.isNumber(value))
                return value.toFixed(2) + '%';
            else
                return value;

            break;
        case Report.dataTypes.numeric:
        case Report.dataTypes.currency:
        case "numeric":
        case "currency":

            if (value == undefined || value == null)
                return '';

            if (format)
                return numeral(value).format(format);

            return value.toFixed(2);
            break;
        case Report.dataTypes.integer:
        case "integer":

            if (value == undefined || value == null)
                return '';

            if (format)
                return numeral(value).format(format);

            return value.toLocaleString();

            break;
        case Report.dataTypes.date:
        case "date":
            //  format ISO dates only to local string
            if (value && value.substr(value.length - 1, 1) == 'Z') {
                var ret = new Date(value);

                var yyyy = ret.getFullYear().toString();
                var mm = (ret.getMonth()+1).toString(); // getMonth() is zero-based
                var dd  = ret.getDate().toString();
                var hh  = ret.getHours().toString();
                var min  = ret.getMinutes().toString();
                var ss  = ret.getSeconds().toString();
                return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]) + ' ' + (hh[1]?hh:"0"+hh[0]) + ':' + (min[1]?min:"0"+min[0]) + ':' + (ss[1]?ss:"0"+ss[0]);

            }
        default:
            return value || '(not set)';
    }
};

/*  ----------  Filter routines  ----------
 Functions that manage filters
 */
var Filter = {

    init: function(containerId, apiUrl, projectId, dataObj, filterOptions) {

        if (filterOptions) {

            //  Setup selectize to work with the builder
            for (var f = 0; f < filterOptions.length; f++) {
                var filter = filterOptions[f];

                //  set up selectize plugin for 'in' types
                if (filter.operators[0] == 'in') {
                    filter['plugin'] = 'selectize';
                    filter['plugin_config'] = {
                        create: true,
                        closeAfterSelect: true,
                        multiple: true,
                        maxItems: 8,
                        plugins: ['remove_button'],
                        onItemAdd: function () {
                            this.blur();
                        }
                    };

                    filter.valueSetter = function(rule, value) {
                        rule.$el.find('.rule-value-container select')[0].selectize.setValue(value);
                    };
                }
            }
        }

        $('#' + containerId).queryBuilder({
            filters: filterOptions,
            rules: null,
            plugins: {
                'filter-description': { mode: 'popover' }
            }
        });

        if (dataObj && dataObj.hasOwnProperty('query')) {
            Filter.setRules(containerId, dataObj.query);
        }

        $('#' + containerId).on('afterUpdateRuleOperator.queryBuilder', function(e, rule, error, value) {
            Filter.styleValue(rule, apiUrl, projectId);
        });

        $('#' + containerId).on('afterUpdateRuleFilter.queryBuilder', function(e, rule, error, value) {
            Filter.styleValue(rule, apiUrl, projectId);
        });
    },

    setRules: function(containerId, rules) {

        if (rules) {

            //  querybuilder needs a filter that begins with $and or $or
            if (!rules.$and && !rules.$or)
                rules = { $and: [ rules ] };

            $('#' + containerId).queryBuilder('setRulesFromMongo', rules);
        }
    },

    styleValue: function(rule, apiUrl, projectId) {

        switch (rule.filter.type) {
            case 'string':

                if (rule.filter.searchable && (rule.operator.type == 'equal' || rule.operator.type == 'not_equal')) {

                    var matcher = function(query, sync, async) {
                        var url = '/search?attribute=' + rule.filter.id + '&projectId=' + projectId + '&value=' + encodeURIComponent(query);

                        $.ajax(url, {
                                success: function(data, status){
                                    async(data);
                                }
                            }
                        );
                    };

                    $('input[name*="' + rule.id + '_value_"]').typeahead('destroy');
                    $('input[name*="' + rule.id + '_value_"]').typeahead({ minLength: 0 }, {
                        name: 'kvs',
                        limit: 20,
                        source: matcher
                    });

                    $('input[name*="' + rule.id + '_value_"]').bind('typeahead:select', function(ev, suggestion) {
                        $('input[name*="' + rule.id + '_value_"]').trigger("change");   //  typeahead needs to fire this or builder doesn't see change
                    });
                }
                break;
            case 'date':
                //  default to ISO date format if not specified on attribute
                var format = rule.filter.validation ? rule.filter.validation.format : 'YYYY-MM-DD';
                var timePicker = format.indexOf('h') > -1;

                $('input[name*="' + rule.id + '_value_"]').daterangepicker({
                    singleDatePicker: true,
                    autoUpdateInput: false,
                    timePicker: timePicker,
                    minDate: '1999-01-01',
                    maxDate: '2100-01-01',  // do not remove - dateRangePicker needs it
                    locale: {
                        "format": format
                    }
                },
                function(start, end, label) {
                    $('input[name*="' + rule.id + '_value_"]').val(start.format(format)).change();
                });

                $('input[name*="' + rule.id + '_value_"]').on('apply.daterangepicker', function(ev, picker) {
                    $('input[name*="' + rule.id + '_value_"]').val(picker.startDate.format(format)).change();
                    runQuery();
                });

                break;
        }
    },

    //  Validate a filter component - empty is ok.
    validate: function(element) {

        var filterModel = $('#' + element).queryBuilder('getModel');

        if (filterModel.rules.length > 1 || (filterModel.rules.length == 1 && filterModel.rules[0].filter)) {
            if (!$('#' + element).queryBuilder('validate')) {
                return false;
            }
        }

        return true;
    },

    //  For filters that are embedded into a page, set up the UI interactions here
    configureEmbeddedFilter: function(element) {

        //  when a rule is updated on the filter (and it's valid), refresh the screen
        var ruleUpdated = function(rule) {

            if (rule.operator.type == 'is_null' || rule.operator.type == 'is_not_null') {
                runQuery();
                return;
            }

            if (rule.value == undefined || rule.value == '' || (Utils.isArray(rule.value) && rule.value.length == 0))
                return;

            runQuery();
        };

        //  set up refresh of report when the value of filter changes
        $('#' + element).on('afterUpdateRuleValue.queryBuilder', function(e, rule, error) {
            ruleUpdated(rule);
        });

        //  set up refresh of report when the operator of filter changes
        $('#' + element).on('afterUpdateRuleOperator.queryBuilder', function(e, rule, error) {
            ruleUpdated(rule);
        });

        //  refresh report when a rule is deleted
        $('#' + element).on('afterDeleteRule.queryBuilder', function(e, rule, error) {
            runQuery();
        });

        //  refresh report when a group is deleted
        $('#' + element).on('afterDeleteGroup.queryBuilder', function(e, rule, error) {
            runQuery();
        });

        //  the filter is allowed to be empty when validating
        $('#' + element).on('validationError.queryBuilder', function(e, node, error, value) {
            if ((error[0] == 'no_filter' || error[0] == 'empty_group') && node.model.root.rules.length <= 1) {
                e.preventDefault();

                if (node.model.root.rules.length == 0)
                    $('#' + element).queryBuilder('reset');
            }
        });
    }
};

var Toolbar = {
    intervals: null,
    dateStart: 0,
    dateEnd: 0,
    dateLabel: '',
    dateInterval: '',

    init: function(intervals) {

        Toolbar.intervals = intervals;
    
        $('#reportRange').daterangepicker({
            linkedCalendars: false,
            startDate: moment().subtract(29, 'days'),
            endDate: moment(),
            minDate: '1999-01-01',
            maxDate: '2100-01-01',
            ranges: {
                'Today': Toolbar.range('Today'),
                'Yesterday': Toolbar.range('Yesterday'),
                'Last 24 Hours': Toolbar.range('Last 24 Hours'),
                'Last 7 Days': Toolbar.range('Last 7 Days'),
                'Last 30 Days': Toolbar.range('Last 30 Days'),
                'This Month': Toolbar.range('This Month'),
                'Last Month': Toolbar.range('Last Month')
            },
            opens: 'left',
            drops: 'down',
            buttonClasses: ['btn', 'btn-sm'],
            applyClass: 'btn-primary',
            cancelClass: 'btn-default',
            separator: ' to ',
            locale: {
                format: 'YYYY-MM-DD',
                applyLabel: 'Apply',
                cancelLabel: 'Cancel',
                fromLabel: 'From',
                toLabel: 'To',
                customRangeLabel: 'Custom',
                daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr','Sa'],
                monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                firstDay: 1
            }
        }, function(start, end, label) {
            Toolbar.setDateRange(label, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));
        });

        $('#reportRange').on('apply.daterangepicker', function(ev, picker) {

            switch ($('#reportRange').val()) {
                case 'This Month':
                case 'Last Month':
                    Toolbar.updateInterval('Monthly');
                    break;
                case 'Today':
                case 'Yesterday':
                case 'Last 7 Days':
                case 'Last 30 Days':
                case 'Custom':
                    Toolbar.updateInterval('Daily');
                    break;
                case 'Last 24 Hours':
                    Toolbar.updateInterval('Hourly');
                    break;
            }
            runQuery();
        });

        $('#reportRange').on('change.daterangepicker', function(ev, picker) {
            Toolbar.setDateRange(Toolbar.dateLabel, Toolbar.dateStart, Toolbar.dateEnd, Toolbar.dateInterval);
        });

        if (Toolbar.intervals && Toolbar.intervals.defaultRange)
            Toolbar.setDateRange(Toolbar.intervals.defaultRange, null, null, Toolbar.intervals.defaultOption);
        else
            Toolbar.setDateRange('Last 30 Days');
    },

    initLog: function() {

        $('#reportRange').daterangepicker({
            linkedCalendars: false,
            timePicker: true,
            startDate: moment(),
            endDate: moment(),
            minDate: '1999-01-01',
            maxDate: '2100-01-01',  // do not remove - dateRangePicker needs it
            ranges: {
                'Today': Toolbar.range('Today')
            },
            opens: 'left',
            drops: 'down',
            buttonClasses: ['btn', 'btn-sm'],
            applyClass: 'btn-primary',
            cancelClass: 'btn-default',
            separator: ' to ',
            locale: {
                format: 'YYYY-MM-DD h:mm A',
                applyLabel: 'Apply',
                cancelLabel: 'Cancel',
                fromLabel: 'From',
                toLabel: 'To',
                customRangeLabel: 'Custom',
                daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr','Sa'],
                monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                firstDay: 1
            }
        }, function(start, end, label) {
            Toolbar.setDateRange(label, start.format('YYYY-MM-DD  h:mm A'), end.format('YYYY-MM-DD  h:mm A'));
        });

        $('#reportRange').on('apply.daterangepicker', function(ev, picker) {
            runQuery();
        });

        $('#reportRange').on('change.daterangepicker', function(ev, picker) {
            Toolbar.setDateRange(Toolbar.dateLabel, Toolbar.dateStart, Toolbar.dateEnd, Toolbar.dateInterval);
        });

        Toolbar.setDateRange('Today');
    },

    addToDashboard: function() {
        var data = {
            name: $('#dashboard-name').val(),
            title: $('#pod-title').val(),
            display: $('input[name=pod-type]:checked').val(),
            state: report.state
        };

        $.ajax({
            type: 'POST',    //  if the data object has an id, PUT the update
            url: '/setup/dashboards/pods',
            data: data,
            success: function (data, status) {
                window.location = '/dashboard?name=' + encodeURIComponent($('#dashboard-name').val());
            },
            error: function (request, status, error) {
                Data.showError(request, status, error);
            }
        });
    },

    createBookmark: function() {

        if (report && report.state) {
            report.state.title = $('#bookmarkName').val();
            pushState();
        }

        var query = window.location.pathname + window.location.search;

        var val = $('#bookmarkName').val();

        if (!val) {
            $('#bookmarkName').addClass('has-error');
            return;
        }

        if (val.indexOf('\'') > -1 || val.indexOf('"') > -1 || val.indexOf('&') > -1 || val.indexOf('<') > -1 || val.indexOf('>') > -1) {
            Page.alert('Bookmark names cannot contain \' " & < >.');
            return false;
        }

        var frm = {
            name: $('#bookmarkName').val(),
            query: query
        };

        Data.submitForm('/setup/bookmarks/', frm, function(result){

            if (result) {
                Page.showMessage(frm.name + " was created.");

                //  add bookmark
                for (var i = 0; i < Page.menuItems.length; i++) {

                    if (Page.menuItems[i].title == 'Bookmarks') {

                        if (!Page.menuItems[i].items)
                            Page.menuItems[i].items = [];

                        Page.menuItems[i].items.push({ title: frm.name, url: query });
                    }
                }
                Page.renderMenu();
            }
            $('#bookmarkName').val('');
            $('#bookmarkCreateModal').modal('hide');
        });
    },

    updateInterval: function(interval) {
        Toolbar.dateInterval = interval;
        $('#reportIntervalTitle').html(interval);
        $('#reportTimeframe').html(Toolbar.dateStart + ' to ' + Toolbar.dateEnd);
    },

    inSetDateRange: false,

    setDateRange: function(label, start, end, interval) {

        Toolbar.dateStart = start;
        Toolbar.dateEnd = end;
        Toolbar.dateLabel = label;

        if (!interval)
            interval = Toolbar.dateInterval;

        if (!interval)
            interval = 'Daily';

        if (label && label != 'Custom')
            $('#reportRange').val(label);
        else {

            if (moment(start).hour() == 0 && moment(start).minute() == 0 && moment(end).hour() == 0 && moment(end).minute() == 0) {
                if (start == end)
                    $('#reportRange').val(moment(start).format('MMM D, YYYY'));
                else
                    $('#reportRange').val(moment(start).format('MMM D, YYYY') + ' - ' + moment(end).format('MMM D, YYYY'));
            } else {
                $('#reportRange').val(moment(start).format('YYYY-MM-DD h:mm A') + ' to ' + moment(end).format('YYYY-MM-DD h:mm A'));
            }
        }

        switch (label) {
            case 'Today':
            case 'Last 24 Hours':
            case 'Last 7 Days':
            case 'Last 30 Days':
            case 'This Month':
                $('#nextPeriod').addClass('disabled');
                break;
            default:
                $('#nextPeriod').removeClass('disabled');
        }

        if (Toolbar.range(label)) {
            Toolbar.dateStart = Toolbar.range(label)[0];
            Toolbar.dateEnd = Toolbar.range(label)[1];
        }

        if (this.inSetDateRange)
            return;

        this.inSetDateRange = true;

        if (!$('#reportRange').data('daterangepicker').startDate.isSame(moment(Toolbar.dateStart)))
            $('#reportRange').data('daterangepicker').setStartDate(moment(Toolbar.dateStart));

        if (!$('#reportRange').data('daterangepicker').endDate.isSame(moment(Toolbar.dateEnd)))
            $('#reportRange').data('daterangepicker').setEndDate(moment(Toolbar.dateEnd));

        this.inSetDateRange = false;

        Toolbar.updateInterval(interval);
    },

    next: function() {
        var diff;

        switch (Toolbar.dateLabel) {
            case 'Yesterday':
                Toolbar.setDateRange('Today');
                break;
            case 'Last Month':
                Toolbar.setDateRange('This Month');
                break;
            case 'Custom':
                if (moment(Toolbar.dateStart).hour() == 0 && moment(Toolbar.dateStart).minute() == 0 && moment(Toolbar.dateEnd).hour() == 0 && moment(Toolbar.dateEnd).minute() == 0) {
                    diff = moment(Toolbar.dateEnd).diff(moment(Toolbar.dateStart), 'days') + 1;
                    Toolbar.setDateRange('Custom', moment(Toolbar.dateStart).add(diff, 'days').format('YYYY-MM-DD'), moment(Toolbar.dateEnd).add(diff, 'days').format('YYYY-MM-DD'));
                } else {
                    diff = moment(Toolbar.dateEnd).diff(moment(Toolbar.dateStart), 'minutes');
                    Toolbar.setDateRange('Custom', moment(Toolbar.dateStart).add(diff, 'minutes').format('YYYY-MM-DD h:mm A'), moment(Toolbar.dateEnd).add(diff, 'minutes').format('YYYY-MM-DD h:mm A'));
                }
                break;
            default:
                diff = moment(Toolbar.dateEnd).diff(moment(Toolbar.dateStart), 'days') + 1;
                Toolbar.setDateRange('Custom', moment(Toolbar.dateStart).add(diff, 'days').format('YYYY-MM-DD'), moment(Toolbar.dateEnd).add(diff, 'days').format('YYYY-MM-DD'));
        }
        runQuery();
    },

    prior: function() {
        var diff;

        switch (Toolbar.dateLabel) {
            case 'Today':
                Toolbar.setDateRange('Yesterday');
                break;
            case 'This Month':
                Toolbar.setDateRange('Last Month');
                break;
            case 'Custom':
                if (moment(Toolbar.dateStart).hour() == 0 && moment(Toolbar.dateStart).minute() == 0 && moment(Toolbar.dateEnd).hour() == 0 && moment(Toolbar.dateEnd).minute() == 0) {
                    diff = moment(Toolbar.dateEnd).diff(moment(Toolbar.dateStart), 'days') + 1;
                    Toolbar.setDateRange('Custom', moment(Toolbar.dateStart).subtract(diff, 'days').format('YYYY-MM-DD'), moment(Toolbar.dateEnd).subtract(diff, 'days').format('YYYY-MM-DD'));
                } else {
                    diff = moment(Toolbar.dateEnd).diff(moment(Toolbar.dateStart), 'minutes');
                    Toolbar.setDateRange('Custom', moment(Toolbar.dateStart).subtract(diff, 'minutes').format('YYYY-MM-DD h:mm A'), moment(Toolbar.dateEnd).subtract(diff, 'minutes').format('YYYY-MM-DD h:mm A'));
                }
                break;
            default:
                diff = moment(Toolbar.dateEnd).diff(moment(Toolbar.dateStart), 'days') + 1;
                Toolbar.setDateRange('Custom', moment(Toolbar.dateStart).subtract(diff, 'days').format('YYYY-MM-DD'), moment(Toolbar.dateEnd).subtract(diff, 'days').format('YYYY-MM-DD'));
        }

        runQuery();
    },

    range: function(label) {
        switch (label) {
            case 'Today':
                return [moment().format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')];
            case 'Yesterday':
                return [moment().subtract(1, 'days').format('YYYY-MM-DD'), moment().subtract(1, 'days').format('YYYY-MM-DD')];
            case 'Last 24 Hours':
                return [moment().subtract(24, 'hours').format('YYYY-MM-DD h:mm A'), moment().format('YYYY-MM-DD h:mm A')];
            case 'Last 7 Days':
                return [moment().subtract(6, 'days').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')];
            case 'Last 30 Days':
                return [moment().subtract(29, 'days').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')];
            case 'This Month':
                return [moment().startOf('month').format('YYYY-MM-DD'), moment().endOf('month').format('YYYY-MM-DD')];
            case 'Last Month':
                return [moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')];
        }
    },

    timeframe: function(label, dateStart, dateEnd) {
        switch (label) {
            case 'Today':
                return 'today';
            case 'Yesterday':
                return 'yesterday';
            case 'Last 24 Hours':
                return 'last24Hours';
            case 'Last 7 Days':
                return 'last7Days';
            case 'Last 30 Days':
                return 'last30Days';
            case 'This Month':
                return 'thisMonth';
            case 'Last Month':
                return 'lastMonth';
            default:
                return [ Toolbar.dateStart, Toolbar.dateEnd ];
        }
    },

    intervalAttribute: function(interval) {

        if (Toolbar.intervals && Toolbar.intervals.options) {
            var options = Toolbar.intervals.options;
            
            if (options[interval])
                return options[interval];
            else if (Toolbar.intervals.defaultOption && options[Toolbar.intervals.defaultOption])
                return options[Toolbar.intervals.defaultOption];
        }

        if (Toolbar.intervals && Toolbar.intervals.defaultAttribute)
            return Toolbar.intervals.defaultAttribute;
    }
};

Report.elapsedTime = function(seconds) {
    var sec_num = parseInt(seconds, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var secs = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (secs < 10) { secs = "0" + secs; }
    return hours + ':' + minutes + ':' + secs;
};

/*
    These functions format report data to HTML.  They are used for displaying formatted data in the table primarily, but can be used anywhere.

    These are instance-specific, so they can be replaced on a report by report basis.
 */
Report.prototype.formatters = {

    completionTime: function(value) {

        if (!value)
            return 'N/A';

        return Report.elapsedTime(value);
    },

    events: function(value) {

        if (Utils.isArray(value)) {
            var result = '';

            for (var e = 0; e < value.length; e++) {
                var event = value[e];
                result += Report.elapsedTime(event.secondsFromStart) + ' - ' + event.name;

                if (event.data)
                    result += ' - ' + JSON.stringify(event.data);

                result += '<br />';
            }
            return result;
        } else {
            return value;
        }
    },

    pages: function(value) {

        if (Utils.isArray(value)) {
            var result = '';

            for (var p = 0; p < value.length; p++) {
                var page = value[p];
                result += Report.elapsedTime(page.secondsFromStart) + ' - ' + page.name + '<br />';
            }
            return result;
        } else {
            return value;
        }
    },

    personId: function(value) {
        if (value)
            return '<a href="/person/profile?person=' + encodeURIComponent(value) + '"><i class="fa fa-user"></i>&nbsp; ' + value + '</a>';
        else
            return value;
    }
};
