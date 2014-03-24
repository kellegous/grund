package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"svg"
)

func strOfArgs(a []float64) string {
	v := make([]string, len(a))
	for i, f := range a {
		v[i] = fmt.Sprintf("%f", f)
	}
	return strings.Join(v, ",")
}

func emitCode(w io.Writer, cmds []*svg.Command) error {
	fmt.Fprintln(w, "ctx.beginPath();")
	for _, cmd := range cmds {
		switch cmd.Type {
		case svg.MoveToAbs:
			fmt.Fprintf(w, "ctx.moveTo(%s);\n", strOfArgs(cmd.Args))
		case svg.LineToAbs:
			fmt.Fprintf(w, "ctx.lineTo(%s);\n", strOfArgs(cmd.Args))
		case svg.CubicToAbs:
			fmt.Fprintf(w, "ctx.bezierCurveTo(%s);\n", strOfArgs(cmd.Args))
		case svg.QuadToAbs:
			fmt.Fprintf(w, "ctx.quadCuveTo(%s);\n", strOfArgs(cmd.Args))
		case svg.ClosePath:
			fmt.Fprintln(w, "cxt.closePath();")
		default:
			log.Panic(fmt.Sprintf("cannot handle: %s", cmd))
		}
	}
	return nil
}

func main() {
	f, err := os.Open("arrow.svg")
	if err != nil {
		log.Panic(err)
	}
	defer f.Close()

	paths, err := svg.Paths(f)
	if err != nil {
		log.Panic(err)
	}

	for _, path := range paths {
		cmds, err := svg.ParsePath(path)
		if err != nil {
			log.Panic(err)
		}

		abs := svg.ToAbsolute(cmds)
		if err := emitCode(os.Stdout, abs); err != nil {
			log.Panic(err)
		}
	}
}
