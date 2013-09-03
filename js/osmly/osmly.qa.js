osmly.qa = (function () {
    var qa = {live: false},
        data = {};

    qa.go = function(){
        // toggle qa mode
        if (!qa.live) {
            if (osmly.import.live) osmly.import.go();
            setInterface();
            bind();
            next();
            qa.live = true;
        } else {
            reset();
            unbind();
            unsetInterface();
            qa.live = false;
            osmly.import.go();
        }
    };

    function setInterface() {
        byId('qa').innerHTML = 'Leave QA';
        byId('qa').style.backgroundColor = 'black';
        byId('qa').style.color = 'white';

        var body = byTag('body')[0],
            qablock = createId('div', 'qa-block');
        body.appendChild(qablock);

        var report = createId('div', 'report');
        qablock.appendChild(report);

        var layerz = createId('div', 'toggleLayers');
        qablock.appendChild(layerz);
        layerz.innerHTML = '[w] see original feature';

        var skip = createId('div', 'qa-skip');
        qablock.appendChild(skip);
        skip.innerHTML = '[s] skip';

        var confirmz = createId('div', 'confirm');
        qablock.appendChild(confirmz);
        confirmz.innerHTML = 'confirm';

        showOsmLink();
    }

    function bind() {
        $('#toggleLayers').on('click', toggleLayers);
        $('#qa-skip').on('click', next);
        $('#confirm').on('click', confirm);

        $('body').on('keydown', function(that){
            if (that.keyCode === 87) toggleLayers(); //w
            if (that.keyCode === 83) next(); //s
        });
    }

    function unbind() {
        $('#toggleLayers').off();
        $('#qa-skip').off();
        $('#confirm').off();
        $('body').off('keydown');
    }

    function unsetInterface() {
        byTag('body')[0].removeChild(byId('qa-block'));
        byId('qa').innerHTML = 'QA';
        byId('qa').style.backgroundColor = 'white';
        byId('qa').style.color = 'black';
        resetOsmLink();
    }

    function showOsmLink() {
        setTimeout(function(){
            // give them some time to fade out
            $('#bottom-right').show();
            $('#josm').hide();
            $('#reset').hide();
        }, 1000);
    }

    function resetOsmLink() {
        $('#bottom-right').hide();
        $('#josm').show();
        $('#reset').show();
        $('#osmlink').show();
    }

    function request(callback) {
        $.ajax({
            url: osmly.settings.db + '&qa',
            cache: false,
            dataType: 'json',
            success: function(item){
                data = {
                    id: item[0],
                    geo: JSON.parse(item[1]),
                    problem: item[2],
                    submit: item[3],
                    user: item[4],
                    time: item[5],
                };

                if (data.geo.properties.name) data.name = data.geo.properties.name;
                if (callback) callback();
            }
        });
    }

    function fillReport() {
        var table = createE('table'),
            report = byId('report');
        if (report.getElementsByTagName('table').length) {
            report.removeChild(report.childNodes[0]);
        }
        var tbody = createE('tbody');

        // columns = 'id, geo, problem, submit, user, time'
        for (var item in data) {
            var tr = createE('tr');
            if (item == 'id') tr.innerHTML = '<td>id</td><td>' + data.id + '</td>';
            if (item == 'user') tr.innerHTML = '<td>who</td><td>' + data.user + '</td>';
            if (item == 'time') tr.innerHTML = '<td>when</td><td>' + format_date(data.time) + '</td>';
            if (item == 'problem' && data.problem !== '') tr.innerHTML = '<td>problem</td><td class="k">' + data.problem + '</td>';
            if (item == 'submit' && data.submit != 1){
                tr.innerHTML = '<td>via</td><td>' + data.submit + '</td>';
            }
            if (item == 'name') tr.innerHTML = '<td>name</td><td>' + data.name + '</td>';
            if (tr.innerHTML !== '') tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        report.appendChild(table);
    }

    function next() {
        reset();
        request(function(){
            fillReport();
            setGeometry();
            if (osmly.import.contextLayer) setContext();
        });
    }

    function reset() {
        if (osmly.import.contextLayer) osmly.map.removeLayer(osmly.import.contextLayer);
        if (data.oGeometry) osmly.map.removeLayer(data.oGeometry);
        byId('toggleLayers').innerHTML = '[w] see original feature';
        $('#qa-block').hide();
        $('#osmlink').hide();
    }

    function setContext() {
        var bounds = data.geo.properties.bounds,
            buffered = [
                bounds[0] - 0.002,
                bounds[1] - 0.002,
                bounds[2] + 0.002,
                bounds[3] + 0.002
            ]; // double the buffer size just to be extra sure

        osmly.map.fitBounds([
            [bounds[1], bounds[0]],
            [bounds[3], bounds[2]]
        ]);

        osmly.import.getOsm(buffered, function(){
            byId('notify').style.display = 'none';
            osmly.map.removeLayer(data.oGeometry);
            osmly.import.contextLayer.addTo(osmly.map);
            osmly.import.contextLayer.bringToFront();
            byId('qa-block').style.display = 'block';
            byId('osmlink').style.display = 'block';
        });

    }

    function setGeometry() {
        data.oGeometry = L.geoJson(data.geo, {
            style: osmly.settings.featureStyle,
        });
        data.oGeometry.addTo(osmly.map);
        data.oGeometry.bringToFront();
    }

    function confirm() {
        osmly.connect.updateItem('confirm', false, false, data.id);
        next();
    }

    function toggleLayers() {
        if (osmly.map.hasLayer(data.oGeometry)) {
            byId('toggleLayers').innerHTML = '[w] see original feature';
            osmly.map.removeLayer(data.oGeometry);
            osmly.import.contextLayer.addTo(osmly.map);
            osmly.import.contextLayer.bringToFront();
        } else {
            byId('toggleLayers').innerHTML = '[w] see OSM data';
            osmly.map.removeLayer(osmly.import.contextLayer);
            data.oGeometry.addTo(osmly.map);
            data.oGeometry.bringToFront();
        }
    }

    return qa;
}());
