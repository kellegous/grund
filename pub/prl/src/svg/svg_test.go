package svg

import (
	"math"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

var root string

func init() {
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		panic("cannot determine test location")
	}

	path, err := filepath.Abs(filepath.Dir(file))
	if err != nil {
		panic("cannot determine test location")
	}

	root = path
}

func pathFor(name string) string {
	return filepath.Join(root, name)
}

func TestPaths(t *testing.T) {
	r, err := os.Open(pathFor("test.svg"))
	if err != nil {
		t.Error(err)
		return
	}
	defer r.Close()

	paths, err := Paths(r)

	if len(paths) != 1 {
		t.Errorf("Expected 1 path, got %d", len(paths))
	}
}

func expectParse(t *testing.T, s string, v float64, p string) string {
	pv, path, err := parseValue(s)
	if err != nil {
		t.Fatal(err)
	}

	if math.Abs(v-pv) > 0.001 {
		t.Fatalf("expected %f, got %f", v, pv)
	}

	if path != p {
		t.Fatalf("expected \"%s\", got \"%s\"", p, path)
	}

	return path
}

func expectParses(t *testing.T, s string, v []float64, p string) {
	pv, path, err := parseValues(s, len(v))
	if err != nil {
		t.Fatal(err)
	}

	if len(pv) != len(v) {
		t.Fatalf("expected %d results, got %d", len(v), len(pv))
	}

	for i, ev := range pv {
		if math.Abs(ev-v[i]) > 0.001 {
			t.Fatalf("expected %f, got %f", ev, v[i])
		}
	}

	if path != p {
		t.Fatalf("expected \"%s\", got \"%s\"", p, path)
	}
}

func TestParseValue(t *testing.T) {
	var path string

	// simple > 0
	expectParse(t, "32.00", 32, "")

	// single < 0
	expectParse(t, "-32.0", -32, "")

	// double separated by -
	path = expectParse(t, "-32.00-42.00", -32, "-42.00")
	expectParse(t, path, -42.0, "")

	//double separated by ,
	path = expectParse(t, "32,42", 32, "42")
	expectParse(t, path, 42, "")

	// ensure subsequent command is in good shape
	path = expectParse(t, "32,42m12,12", 32, "42m12,12")
	expectParse(t, path, 42, "m12,12")
}

func TestParseValues(t *testing.T) {
	expectParses(t, "32,42,52", []float64{32, 42, 52}, "")
	expectParses(t, "-32-42-52", []float64{-32, -42, -52}, "")
	expectParses(t, "-32,-42,-52", []float64{-32, -42, -52}, "")
	expectParses(t, "-32-42-52.01m80-90", []float64{-32, -42, -52.01}, "m80-90")
}

func TestParsePath(t *testing.T) {
	r, err := os.Open(pathFor("test.svg"))
	if err != nil {
		t.Error(err)
		return
	}
	defer r.Close()

	paths, err := Paths(r)

	for _, path := range paths {
		cmds, err := ParsePath(path)
		if err != nil {
			t.Error(err)
		}

		t.Logf("%v", cmds)
	}
}
