OSMLY_JS = \
	js/osmly/settings.js \
	js/osmly/osmly.js \
	js/osmly/osmly.map.js \
	js/osmly/osmly.ui.js \
	js/osmly/osmly.connect.js \
	js/osmly/osmly.import.js \
	js/osmly/osmly.overview.js \
	js/osmly/osmly.qa.js \
	js/osmly/common.js \
	js/osmly/animations.js

CSS = \
	js/lib/leaflet-0.6.4/leaflet.css \
	css/leaflet.label.css \
	css/general_foundicons.css \
	css/css.css \
	css/leaflet-overwrite.css \
	css/animations.css \
	css/modal.css

JS_LIBS = \
	js/lib/leaflet-0.6.4/leaflet.js \
	js/lib/Bing.js \
	js/lib/leaflet.draw.js \
	js/lib/leaflet.label.js \
	js/lib/osm_geojson.js \
	js/lib/osmauth.js \
	js/lib/sha.js \
	js/lib/modal.js \
	js/lib/zepto.js

all: dist/osmly.min.js  dist/libs.min.js dist/osmly.min.css dist/static

dist/osmly.js: $(OSMLY_JS) Makefile
	@rm -f $@
	cat $(OSMLY_JS) >> $@

dist/osmly.min.js: dist/osmly.js Makefile
	@rm -f $@
	node_modules/.bin/uglifyjs $< -c -m -o $@
	rm -f dist/osmly.js

dist/libs.js: $(JS_LIBS) Makefile
	@rm -f $@
	cat $(JS_LIBS) >> $@

dist/libs.min.js: dist/libs.js Makefile
	@rm -f $@
	node_modules/.bin/uglifyjs $< -c -m -o $@
	rm -f dist/libs.js

dist/osmly.css: $(CSS) Makefile
	@rm -f $@
	cat $(CSS) >> $@

dist/osmly.min.css: dist/osmly.css Makefile
	@rm -f $@
	node_modules/.bin/uglifycss $< > $@
	rm -f dist/osmly.css

dist/static:
	cp -R -f static dist/static

clean:
	rm -f dist/osmly*
	rm -f dist/libs*
	rm -f -R dist/static
