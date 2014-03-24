package svg

import (
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"unicode"
	"unicode/utf8"
)

type CmdType int

const (
	MoveToAbs CmdType = iota
	MoveToRel
	ClosePath
	LineToAbs
	LineToRel
	HorzLineToAbs
	HorzLineToRel
	VertLineToAbs
	VertLineToRel
	CubicToAbs
	CubicToRel
	SmoothCubicToAbs
	SmoothCubicToRel
	QuadToAbs
	QuadToRel
	SmoothQuadToAbs
	SmoothQuadToRel
	EllipseAbs
	EllipseRel
)

func (t CmdType) String() string {
	switch t {
	case MoveToAbs:
		return "MoveToAbs"
	case MoveToRel:
		return "MoveToRel"
	case ClosePath:
		return "ClosePath"
	case LineToAbs:
		return "LineToAbs"
	case LineToRel:
		return "LineToRel"
	case HorzLineToAbs:
		return "HorzLineToAbs"
	case HorzLineToRel:
		return "HorzLineToRel"
	case VertLineToAbs:
		return "VertLineToAbs"
	case VertLineToRel:
		return "VertLineToRel"
	case CubicToAbs:
		return "CubicToAbs"
	case CubicToRel:
		return "CubicToRel"
	case SmoothCubicToAbs:
		return "SmoothCubicToAbs"
	case SmoothCubicToRel:
		return "SmoothCubicToRel"
	case QuadToAbs:
		return "QuadToAbs"
	case QuadToRel:
		return "QuadToRel"
	case SmoothQuadToAbs:
		return "SmoothQuadToAbs"
	case SmoothQuadToRel:
		return "SmoothQuadToRel"
	case EllipseAbs:
		return "EllipseAbs"
	case EllipseRel:
		return "EllipseRel"
	}
	panic("unreachable")
}

type Command struct {
	Type CmdType
	Args []float64
}

func (c *Command) String() string {
	return fmt.Sprintf("%s %v", c.Type, c.Args)
}

func findAttr(e *xml.StartElement, name string) (string, bool) {
	for _, attr := range e.Attr {
		if attr.Name.Local == name {
			return attr.Value, true
		}
	}
	return "", false
}

func parseValue(path string) (float64, string, error) {
	if len(path) == 0 {
		return 0, "", errors.New("empty string contain no value")
	}

	// decode the first rune
	r, n := utf8.DecodeRuneInString(path)
	if n != 1 {
		return 0, "", errors.New(fmt.Sprintf("invalid character: %s", r))
	}

	for i := 1; i < len(path); i++ {
		r, n := utf8.DecodeRuneInString(path[i:])
		if n != 1 {
			return 0, "", errors.New(fmt.Sprintf("invalid character: %s", r))
		}

		if unicode.IsDigit(r) || r == '.' || r == 'e' || r == 'E' {
			continue
		}

		// we need to parse the number now.
		v, err := strconv.ParseFloat(path[:i], 64)
		if err != nil {
			return 0, path, err
		}

		if r == ',' {
			path = path[i+1:]
		} else {
			path = path[i:]
		}

		return v, path, nil
	}

	v, err := strconv.ParseFloat(path, 64)
	if err != nil {
		return 0, path, err
	}

	return v, "", nil
}

func parseValues(path string, n int) ([]float64, string, error) {
	vals := make([]float64, n)
	for i := 0; i < n; i++ {
		v, p, err := parseValue(path)
		if err != nil {
			return nil, path, err
		}
		vals[i] = v
		path = p
	}

	return vals[:], path, nil
}

func parseCommand(path string, t CmdType, n int) (*Command, string, error) {
	v, p, err := parseValues(path, n)
	if err != nil {
		return nil, "", err
	}

	return &Command{Type: t, Args: v}, p, nil
}

func nextCommand(path string) (*Command, string, error) {
	// TODO(knorton): Handle repeated command pattern by having callers pass
	// in a currentCommand argument.
	switch path[0] {
	case 'M':
		return parseCommand(path[1:], MoveToAbs, 2)
	case 'm':
		return parseCommand(path[1:], MoveToRel, 2)
	case 'L':
		return parseCommand(path[1:], LineToAbs, 2)
	case 'l':
		return parseCommand(path[1:], LineToRel, 2)
	case 'H':
		return parseCommand(path[1:], HorzLineToAbs, 1)
	case 'h':
		return parseCommand(path[1:], HorzLineToRel, 1)
	case 'V':
		return parseCommand(path[1:], VertLineToAbs, 1)
	case 'v':
		return parseCommand(path[1:], VertLineToRel, 1)
	case 'C':
		return parseCommand(path[1:], CubicToAbs, 6)
	case 'c':
		return parseCommand(path[1:], CubicToRel, 6)
	case 'S':
		return parseCommand(path[1:], SmoothCubicToAbs, 4)
	case 's':
		return parseCommand(path[1:], SmoothCubicToRel, 4)
	case 'Q':
		return parseCommand(path[1:], QuadToAbs, 4)
	case 'q':
		return parseCommand(path[1:], QuadToRel, 4)
	case 'T':
		return parseCommand(path[1:], SmoothQuadToAbs, 2)
	case 't':
		return parseCommand(path[1:], SmoothQuadToRel, 2)
	case 'A':
		return parseCommand(path[1:], EllipseAbs, 7)
	case 'a':
		return parseCommand(path[1:], EllipseRel, 7)
	case 'Z', 'z':
		return &Command{Type: ClosePath}, "", nil
	}

	return nil, path, errors.New(
		fmt.Sprintf("invalid command: %s", path[0:1]))
}

// A regexp to remove all whitespace from a string.
var removeWhitespace = regexp.MustCompile("\\s+")

func ParsePath(path string) ([]*Command, error) {
	path = removeWhitespace.ReplaceAllString(path, "")
	var cmds []*Command = nil
	for len(path) > 0 {
		c, p, err := nextCommand(path)
		if err != nil {
			return nil, err
		}

		path = p
		cmds = append(cmds, c)
	}

	return cmds, nil
}

func Paths(r io.Reader) ([]string, error) {
	var paths []string
	d := xml.NewDecoder(r)
	for {
		t, err := d.Token()
		if err == io.EOF {
			return paths, nil
		} else if err != nil {
			return nil, err
		}

		e, ok := t.(xml.StartElement)
		if !ok || e.Name.Local != "path" {
			continue
		}

		a, ok := findAttr(&e, "d")
		if !ok {
			continue
		}

		paths = append(paths, a)
	}

	panic("unreachable")
}

func absArgs(src []float64, dst []float64, x, y *float64) []float64 {
	n := len(src)
	tx, ty := *x, *y
	for i := 0; i < n; i += 2 {
		tx = src[i] + tx
		ty = src[i+1] + ty
		dst[i] = tx
		dst[i+1] = ty
	}

	*x = tx
	*y = ty

	return dst
}

func smoothControlPt(cmd *Command, x, y float64) (float64, float64) {
	n := len(cmd.Args)
	switch cmd.Type {
	case CubicToAbs, QuadToAbs:
		// distance from current point to last control point
		dx, dy := cmd.Args[n-4]-x, cmd.Args[n-3]-y
		return x - dx, y - dy
	}
	return x, y
}

func ToAbsolute(cmds []*Command) []*Command {
	x, y := 0.0, 0.0
	c := make([]*Command, len(cmds))
	var prev *Command
	for i, cmd := range cmds {
		args := cmd.Args
		switch cmd.Type {
		case MoveToAbs, LineToAbs, CubicToAbs, QuadToAbs, EllipseAbs:
			c[i] = cmd
			x, y = args[len(args)-2], args[len(args)-1]
		case HorzLineToAbs:
			x = args[0]
			c[i] = &Command{LineToAbs, []float64{x, y}}
		case VertLineToAbs:
			y = args[0]
			c[i] = &Command{LineToAbs, []float64{x, y}}
		case MoveToRel:
			c[i] = &Command{MoveToAbs, absArgs(args, make([]float64, len(args)), &x, &y)}
		case LineToRel:
			c[i] = &Command{LineToAbs, absArgs(args, make([]float64, len(args)), &x, &y)}
		case HorzLineToRel:
			x += args[0]
			c[i] = &Command{LineToAbs, []float64{x, y}}
		case VertLineToRel:
			y += args[0]
			c[i] = &Command{LineToAbs, []float64{x, y}}
		case CubicToRel:
			c[i] = &Command{CubicToAbs, absArgs(args, make([]float64, len(args)), &x, &y)}
		case QuadToRel:
			c[i] = &Command{QuadToAbs, absArgs(args, make([]float64, len(args)), &x, &y)}
		case SmoothCubicToAbs:
			newArgs := make([]float64, 6)
			copy(newArgs[2:], args)
			newArgs[0], newArgs[1] = smoothControlPt(prev, x, y)
			c[i] = &Command{CubicToAbs, newArgs}
			x, y = newArgs[4], newArgs[5]
		case SmoothCubicToRel:
			newArgs := make([]float64, 6)
			newArgs[0], newArgs[1] = smoothControlPt(prev, x, y)
			absArgs(args, newArgs[2:], &x, &y)
			c[i] = &Command{CubicToAbs, newArgs}
		case ClosePath:
			c[i] = &Command{ClosePath, nil}
		default:
			panic(fmt.Sprintf("cannot handle: %s", cmd))
		}

		// prev is the absolute version of the command
		prev = c[i]
	}

	return c
}
