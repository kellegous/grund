TARGETS=hrt.css

ALL: $(TARGETS)

%.css: %.main.scss
	pork build --opt=basic

publish: $(TARGETS)
	fspub --exclude=.gitignore,Makefile hrt

clean:
	rm -f $(TARGETS)