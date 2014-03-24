TARGETS=a.js b.js a.css b.css edger.js

ALL : $(TARGETS)

%.js : %.main.ts common.ts
	pork build --opt=basic

%.css : %.main.scss
	pork build --opt=basic

publish: $(TARGETS)
	fspub --exclude=Makefile,.gitignore,menu.psd,test.jpg grd

clean:
	rm -f $(TARGETS)