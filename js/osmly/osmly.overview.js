osmly.overview = (function () {
    var overview = {};

    overview.go = function() {
        fadeIn($('#overview_bg, #overview-controls, #overview_block'));
        overview.refresh();
        bind();
    };

    function bind() {
        bean.on(byId('main_table'), 'click', '.editjosm', function(){
            if (osmly.auth.authenticated() && token('user')) {
                osmly.connect.editInJosm(this.getAttribute('data-id'));
            } else {
                osmly.ui.pleaseLogin();
            }
        });

        bean.on(byId('main_table'), 'click', '.markdone', function(){
            if (osmly.auth.authenticated() && token('user')) {
                $('#markdone-modal button')[1].setAttribute('data-id', this.getAttribute('data-id'));
                CSSModal.open('markdone-modal');
            } else {
                osmly.ui.pleaseLogin();
            }
        });

        bean.on(byId('overview_bg'),'click', function(){
            $('#overview_bg, #overview-controls, #overview_block').hide();
            overview.close();
        });

        bean.on(byId('everything'), 'click', overview.everything);
        bean.on(byId('red'), 'click', overview.red);
        bean.on(byId('green'), 'click', overview.green);
        bean.on(byId('users'), 'click', function(){
            overview.drop_selection('users-select');
        });
        bean.on(byId('users-select'), 'change', function(){
            overview.drop_selection('users-select');
        });
        bean.on(byId('problems'), 'click', function(){
            overview.drop_selection('problems-select');
        });
        bean.on(byId('problems-select'), 'change', function(){
            overview.drop_selection('problems-select');
        });

        bean.on(byId('markdone-modal'), 'click', 'button', markDone);
    }

    function unbind() {
        bean.off(byId('main_table'));
        bean.off(byId('overview_bg'));
        bean.off(byId('everything'));
        bean.off(byId('red'));
        bean.off(byId('green'));
        bean.off(byId('users'));
        bean.off(byId('users-select'));
        bean.off(byId('problems'));
        bean.off(byId('problems-select'));
        bean.off(byId('markdone-modal'));
    }

    function buildTable(callback) {
        // will probably need to paginate over ~1000 items
            // right now it's pretty quick w/ 1200 on chrome
            // firefox is a bit slow
        // index from simple.py: id, problem, submit, user
        var items = overview.data,
            table = byId('main_table');

        if (table.getElementsByTagName('tbody').length) {
            table.removeChild(table.getElementsByTagName('tbody')[0]);
        }

        var tbody = createE('tbody');

        for (var a = 0; a < items.length; a++) {
            var tr = createE('tr');
            for (var b = 0; b < items[a].length; b++) {
                var column = createE('td'),
                    text = items[a][b];

                if (b == 2) {
                    // checkmark for submitted items
                    if (items[a][b] !== '') text = '&#x2713;';
                    else text = '';
                }

                column.innerHTML = text;
                tr.appendChild(column);
            }

            var markdone = createE('td');
            if (items[a][2] === '') {
                markdone.innerHTML = '<span data-id="' + items[a][0] + '" class="markdone">mark as done?</span>';
            }
            tr.appendChild(markdone);

            var editjosm = createE('td');
            if (items[a][2] === '') {
                editjosm.innerHTML = '<span data-id="' + items[a][0] + '" class="editjosm">edit in JOSM</span>';
            }
            tr.appendChild(editjosm);

            if (items[a][2] !== '') {
                tr.setAttribute('class', 'success');
            } else if (items[a][1] !== '') {
                tr.setAttribute('class', 'error');
            }

            tbody.appendChild(tr);
            table.appendChild(tbody);
        }
        $('#notify').hide();
        update_row_count();
        if (callback) callback();
    }

    function request(callback) {
        reqwest({
            url: osmly.settings.db + '&overview',
            cache: false,
            crossOrigin: true,
            type: 'json',
            success: function(items){
                overview.data = items;
                overview.rawData = items;
                // they both start this way, .data get modified
                if (callback) callback();
            }
        });
    }

    // entry point
    overview.refresh = function(callback) {
        osmly.ui.notify('Loading...');
        request(function() {
            buildTable(callback);
            problem_selection();
            user_selection();
        });
    };

    function filter(options) {
        // {'problem': 1, 'user': 'Joe Fake Name'}
        // also takes values as a list of multiple possible values
            // {'problem': ['no_park', 'bad_imagery', 'you_ugly']}
            // or even better: {'problem': unique('problem')}
        // index from simple.py: id, problem, submit, user
        // if multiple keys are provided a value from each key must be true
        var ndx = {
            'problem': 1,
            'submit': 2,
            'user': 3
        };

        var items = overview.rawData,
            optionslength = Object.keys(options).length,
            out = [];

        for (var a = 0; a < items.length; a++) {
            var keep = [];
            for (var option in options) {
                if (typeof options[option] == 'object') {
                    if (options[option].indexOf(items[a][ndx[option]]) !== -1) {
                        keep.push(true);
                    }
                } else if (items[a][ndx[option]] == options[option]) {
                    keep.push(true);
                }
            }
            if (keep.length === optionslength) {
                out.push(items[a]);
            }
        }
        overview.data = out;
    }

    function unique(column) {
        // lists unique values for a given column
        // probably only useful for 'problem' and 'user'
        var ndx = {
            'problem': 1,
            'submit': 2,
            'user': 3
        };
        
        var items = overview.rawData,
            vals = [];

        for (var a = 0; a < items.length; a++) {
            if (items[a][ndx[column]] && vals.indexOf(items[a][ndx[column]]) === -1) {
                vals.push(items[a][ndx[column]]);
            }
        }

        return vals;
    }

    function problem_selection() {
        var problems = unique('problem'),
            html = '',
            select = byId('problems-select');

        for (var a = 0; a < problems.length; a++) {
            html += '<option value="problem:' + problems[a] + '">' + problems[a] + '</option>';
        }

        select.innerHTML = html;
    }

    function user_selection() {
        var user = unique('user'),
            html = '',
            select = byId('users-select');

        for (var a = 0; a < user.length; a++) {
            html += '<option value="user:' + user[a] +'">' + user[a] + '</option>';
        }

        select.innerHTML = html;
    }

    function changeRadio(value) {
        var controls = byId('overview-controls'),
            inputs = controls.getElementsByTagName('input');

        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].type === 'radio') {
                if (inputs[i].value == value) {
                    inputs[i].checked = true;
                } else {
                    inputs[i].checked = false;
                }
            }
        }
    }

    overview.everything = function() {
        overview.data = overview.rawData;
        buildTable();
    };

    overview.red = function() {
        filter({
            'problem': unique('problem'),
            'submit': ''
        });
        changeRadio('red');
        buildTable();
    };

    overview.green = function() {
        filter({'submit': unique('submit')});
        changeRadio('green');
        buildTable();
    };

    overview.drop_selection = function(select) {
        // gets the value of the changed dropdown menu and filters based on it
        // also selects the parent radio button
        var selector = byId(select),
            value = selector.options[selector.selectedIndex].value,
            dict = {};
        value = value.split(':');
        dict[value[0]] = value[1];
            // dict is necessary because literal value = {value[0]: value[1]} didn't work
                // why doesn't that work?
        if (value[0] == 'problem') dict['submit'] = 0;
            // only want un-submitted problems, not strictly true but more useful

        filter(dict);
        buildTable();
        changeRadio(select.split('-')[0]);
    };

    function update_row_count() {
        var count = byId('count');

        if (overview.data.length === overview.rawData.length) {
            count.innerHTML = overview.data.length;
        } else {
            count.innerHTML = overview.data.length.toString() + '<span>/' + overview.rawData.length + '</span>';
        }
    }

    overview.close = function() {
        overview.data = false;
        overview.rawData = false;

        if (byTag('tbody').length) {
            byId('main_table').removeChild(table.getElementsByTagName('tbody')[0]);
        }

        changeRadio('everything');
        byId('count').innerHTML = '';
        unbind();
    };

    function markDone() {
        var result = this.getAttribute('data-type');
        if (result == 'yes') {
            if (osmly.auth.authenticated() && token('user')) {
                osmly.connect.updateItem('submit', {submit: 'Mark as Done'}, function(){
                    osmly.overview.modalDone(function(){
                        CSSModal.close();
                    });
                }, this.getAttribute('data-id'));
            } else {
                CSSModal.close();
                ui.pleaseLogin();
            }
        } else {
            CSSModal.close();
        }
    }

    overview.modalDone = function(callback) {
        changeRadio('everything');
        overview.refresh(callback);
    };

    return overview;
}());
