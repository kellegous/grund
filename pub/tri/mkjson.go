package main

import (
  "bufio"
  "bytes"
  "encoding/json"
  "errors"
  "fmt"
  "io"
  "os"
  "regexp"
  "strings"
  "strconv"
  "unicode/utf8"
)

type result struct {
  Pos     int
  Dq      bool
  Dnf     bool
  Time    Duration
  Name    string
  City    string
  State   string
  Country string
  Cat     string
  Swim    Duration
  T1      Duration
  Bike    Duration
  T2      Duration
  Run     Duration
}

type Duration int

const (
  Second Duration = 1
  Minute Duration = 60 * Second
  Hour   Duration = 60 * Minute
)

func (d Duration) String() string {
  return DurationToString(d)
}

func ReadLines(filename string) ([]string, error) {
  r, err := os.Open(filename)
  if err != nil {
    return nil, err
  }

  l := []string{}
  br := bufio.NewReader(r)
  var b bytes.Buffer
  var (
    part   []byte
    prefix bool
  )
  for {
    if part, prefix, err = br.ReadLine(); err != nil {
      break
    }
    b.Write(part)
    if !prefix {
      l = append(l, b.String())
      b.Reset()
    }
  }

  if err == io.EOF {
    return l, nil
  }

  return l, err
}

func LinesOfData(lines []string) []string {
  // take junk from the beginning
  for len(lines) > 0 {
    if strings.HasPrefix(lines[0], "--------  ") {
      lines = lines[1:]
      break
    }
    lines = lines[1:]
  }

  for len(lines) > 0 {
    if strings.TrimSpace(lines[len(lines)-1]) != "" {
      break
    }
    lines = lines[0 : len(lines)-1]
  }

  return lines
}

func DurationToString(d Duration) string {
  hr := d / Hour
  d -= hr * Hour

  mn := d / Minute
  d -= mn * Minute

  if hr > 0 {
    return fmt.Sprintf("%d:%02d:%02d", hr, mn, d)
  }
  return fmt.Sprintf("%d:%02d", mn, d)
}

func StringToDuration(s string) (Duration, error) {
  if s == "" {
    return Duration(0), nil
  }

  p := strings.Split(s, ":")
  var err error
  var hr int64
  var mn int64
  var sc int64

  if len(p) == 3 {
    hr, err = strconv.ParseInt(p[0], 10, 32)
    if err != nil {
      return 0, err
    }
    p = p[1:]
  }

  if len(p) == 2 {
    mn, err = strconv.ParseInt(p[0], 10, 32)
    if err != nil {
      return 0, nil
    }
    p = p[1:]
  }

  sc, err = strconv.ParseInt(p[0], 10, 32)
  if err != nil {
    return 0, nil
  }

  return Duration(hr)*Hour + Duration(mn)*Minute + Duration(sc), nil
}

func Category(s string) (string, error) {
  p := regexp.MustCompile("\\s+")
  idx := p.FindAllStringIndex(s, -1)
  if len(idx) != 1 {
    return "", errors.New(fmt.Sprintf("Invalid: %s", s))
  }
  return s[idx[0][1]:len(s)], nil
}

func ResultsFor(lines []string, fn func(string) (*result, error)) ([]*result, error) {
  results := make([]*result, len(lines))
  for i, line := range lines {
    r, err := fn(line)
    if err != nil {
      return nil, err
    }

    if !utf8.ValidString(r.Country) {

    }
    results[i] = r
  }
  return results, nil
}

func ResultsFunc(o [][]int) func(string) (*result, error) {
  return func(line string) (*result, error) {
    runes := []rune(line)
    r := &result{}

    // Pos
    pos, err := strconv.ParseInt(strings.TrimSpace(
      string(runes[o[0][0]:o[0][1]])), 10, 32)
    if err != nil {
      return nil, err
    }
    r.Pos = int(pos)

    atr := strings.TrimSpace(
      string(runes[o[1][0]:o[1][1]]))
    if atr == "DNF" {
      r.Dnf = true
    } else if atr == "DQ" {
      r.Dq = true
    }

    r.Time, err = StringToDuration(strings.TrimSpace(
      string(runes[o[2][0]:o[2][1]])))
    if err != nil {
      return nil, err
    }

    r.Name = strings.TrimSpace(
      string(runes[o[3][0]:o[3][1]]))
    r.City = strings.TrimSpace(
      string(runes[o[4][0]:o[4][1]]))
    r.State = strings.TrimSpace(
      string(runes[o[5][0]:o[5][1]]))
    r.Country = strings.TrimSpace(
      string(runes[o[6][0]:o[6][1]]))

    cat, err := Category(strings.TrimSpace(
      string(runes[o[7][0]:o[7][1]])))
    if err != nil {
      return nil, err
    }
    r.Cat = cat

    // Times
    r.Swim, err = StringToDuration(strings.TrimSpace(
      string(runes[o[8][0]:o[8][1]])))
    if err != nil {
      return nil, err
    }

    r.T1, err = StringToDuration(strings.TrimSpace(
      string(runes[o[9][0]:o[9][1]])))
    if err != nil {
      return nil, err
    }

    r.Bike, err = StringToDuration(strings.TrimSpace(
      string(runes[o[10][0]:o[10][1]])))
    if err != nil {
      return nil, err
    }

    r.T2, err = StringToDuration(strings.TrimSpace(
      string(runes[o[11][0]:o[11][1]])))
    if err != nil {
      return nil, err
    }

    r.Run, err = StringToDuration(strings.TrimSpace(
      string(runes[o[12][0]:o[12][1]])))
    if err != nil {
      return nil, err
    }

    return r, nil
  }
}

func Export(fr, to string, fn func(string) (*result, error)) error {
  lines, err := ReadLines(fr)
  if err != nil {
    return err
  }
  lines = LinesOfData(lines)
  results, err := ResultsFor(lines, fn)
  if err != nil {
    return err
  }

  for _, result := range results {
    fmt.Printf("%v\n", result)
  }

  w, err := os.Create(to)
  if err != nil {
    return err
  }
  defer w.Close()

  if err := json.NewEncoder(w).Encode(results); err != nil {
    return err
  }

  return nil
}

type Template struct {
  Year int
  Offs [][]int
}

type Results struct {
  Year    int
  Results []*result
}

var (
  o2004 = [][]int{
    []int{0, 5},     // Pos
    []int{6, 9},     // DNF/DQ
    []int{10, 18},   // Time
    []int{19, 43},   // Name
    []int{43, 56},   // City
    []int{56, 58},   // State
    []int{59, 62},   // Country
    []int{68, 81},   // Cat
    []int{95, 103},  // Swim
    []int{111, 116}, // T1
    []int{126, 134}, // Bike
    []int{143, 148}, // T2
    []int{158, 166}, // Run
  }

  o2005 = [][]int{
    []int{0, 5},     // Pos
    []int{6, 9},     // DNF/DQ
    []int{10, 18},   // Time
    []int{19, 43},   // Name
    []int{43, 56},   // City
    []int{56, 58},   // State
    []int{59, 62},   // Country
    []int{68, 83},   // Cat
    []int{97, 105},  // Swim
    []int{113, 118}, // T1
    []int{128, 136}, // Bike
    []int{145, 150}, // T2
    []int{160, 168}, // Run
  }

  o2010 = [][]int{
    []int{0, 5},     // Pos
    []int{6, 9},     // DNF/DQ
    []int{10, 18},   // Time
    []int{19, 51},   // Name
    []int{52, 65},   // City
    []int{65, 67},   // State
    []int{68, 71},   // Country
    []int{77, 92},   // Cat
    []int{106, 114}, // Swim
    []int{122, 127}, // T1
    []int{137, 145}, // Bike
    []int{154, 159}, // T2
    []int{169, 177}, // Run
  }

  o2011 = [][]int{
    []int{0, 5},     // Pos
    []int{6, 9},     // DNF/DQ
    []int{10, 18},   // Time
    []int{19, 51},   // Name
    []int{52, 65},   // City
    []int{65, 67},   // State
    []int{68, 71},   // Country
    []int{77, 92},   // Cat
    []int{106, 114}, // Swim
    []int{122, 127}, // T1
    []int{137, 145}, // Bike
    []int{153, 158}, // T2
    []int{168, 176}, // Run
  }

  o2012 = [][]int{
    []int{0, 5},     // Pos
    []int{6, 9},     // DNF/DQ
    []int{10, 18},   // Time
    []int{19, 42},   // Name
    []int{42, 56},   // City
    []int{56, 59},   // State
    []int{60, 63},   // Country
    []int{64, 78},   // Cat
    []int{86, 93},   // Swim
    []int{95, 100},  // T1
    []int{101, 108}, // Bike
    []int{111, 116}, // T2
    []int{116, 124}, // Run
  }

  Years = []Template{
    Template{2004, o2004},
    Template{2005, o2005},
    Template{2006, o2005},
    Template{2007, o2005},
    Template{2008, o2005},
    Template{2009, o2005},
    Template{2010, o2010},
    Template{2011, o2011},
    Template{2012, o2012},
  }
)

func main() {
  for _, year := range Years {
    if err := Export(fmt.Sprintf("dat/%d.htm", year.Year), fmt.Sprintf("dat/%d.json", year.Year), ResultsFunc(year.Offs)); err != nil {
      panic(err)
    }
  }

  var all []*Results
  for _, year := range Years {
    r, err := os.Open(fmt.Sprintf("dat/%d.json", year.Year))
    if err != nil {
      panic(err)
    }

    var res []*result
    if err := json.NewDecoder(r).Decode(&res); err != nil {
      panic(err)
    }
    r.Close()
    all = append(all, &Results{Year: year.Year, Results: res})
  }

  w, err := os.Create("dat/all.json")
  if err != nil {
    panic(err)
  }
  defer w.Close()

  if err := json.NewEncoder(w).Encode(all); err != nil {
    panic(err)
  }
}
