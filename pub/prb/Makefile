TARGETS=prb.css

ALL: $(TARGETS)

%.css: %.main.scss
	pork build --opt=basic

publish: $(TARGETS)
	fspub --exclude=Makefile,.gitignore prb

clean:
	rm -f $(TARGETS)