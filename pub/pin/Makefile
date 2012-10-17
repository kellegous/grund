ALL: pin.js pin.css

pins.json: mkjson.go
	go run mkjson.go > pins.json

pin.js: pin.ts
	tsc --out pin.ts.js pin.ts && java -jar ../../out/src/github.com/kellegous/pork/deps/closure/compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js pin.ts.js --js_output_file pin.js && rm -f pin.ts.js

pin.css: pin.scss
	../../out/src/github.com/kellegous/pork/sass --no-cache pin.scss > pin.css

clean:
	rm -f pin.js pin.css pin.ts.js
