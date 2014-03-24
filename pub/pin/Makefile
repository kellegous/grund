TARGETS=pin.js pin.css rand.js rand.css

ALL: $(TARGETS)

%.js: %.main.ts
	pork build --opt=basic

%.css: %.main.scss
	pork build --opt=basic

publish: $(TARGETS)
	fspub --exclude='*.go,b/*,Makefile,.gitignore' pin

clean:
	rm -f $(TARGETS)