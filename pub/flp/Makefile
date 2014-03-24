TARGETS=flp.css

ALL:$(TARGETS)

%.css : %.main.scss
	pork build --opt=basic

publish: $(TARGETS)
	fspub --exclude=Makefile,.gitignore flp

clean:
	rm -f $(TARGETS)