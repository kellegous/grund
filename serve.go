package main

import (
  "encoding/base64"
  "encoding/json"
  "flag"
  "github.com/kellegous/pork"
  "github.com/russross/blackfriday"
  "html/template"
  "io/ioutil"
  "log"
  "net/http"
  "os"
  "path/filepath"
  "runtime"
)

func rootPath() (string, error) {
  _, file, _, _ := runtime.Caller(0)
  return filepath.Abs(filepath.Dir(file))
}

func setup(data string, r pork.Router) {
  r.HandleFunc("/save", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
      http.Error(w, "Invalid", http.StatusMethodNotAllowed)
      return
    }

    var req struct {
      Path string
      Data string
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
      panic(err)
    }

    b, err := base64.StdEncoding.DecodeString(req.Data)
    if err != nil {
      panic(err)
    }

    if err := ioutil.WriteFile(filepath.Join(data, req.Path), b, os.ModePerm); err != nil {
      panic(err)
    }

    res := map[string]interface{}{
      "Error": nil,
    }
    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(res); err != nil {
      panic(err)
    }
  })
}

type handler struct {
  d string
  c pork.Handler
  t string
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
  if r.URL.Path == "/" {
    w.Header().Set("Content-Type", "text/html;charset=utf8")
    projs, err := projects(h.d)
    if err != nil {
      panic(err)
    }

    if err := template.Must(template.ParseFiles(h.t)).Execute(w, projs); err != nil {
      panic(err)
    }

    return
  }

  h.c.ServeHTTP(w, r)
}

type project struct {
  Name string
  Desc template.HTML
}

func readProject(dir string) (*project, error) {
  r, err := ioutil.ReadFile(filepath.Join(dir, "readme.md"))
  if err != nil {
    return nil, err
  }

  return &project{
    Name: filepath.Base(dir),
    Desc: template.HTML(string(blackfriday.MarkdownCommon(r))),
  }, nil
}

func projects(dir string) ([]*project, error) {
  files, err := ioutil.ReadDir(dir)
  if err != nil {
    return nil, err
  }

  var p []*project = nil
  for _, file := range files {
    name := file.Name()
    if len(name) != 3 {
      continue
    }

    proj, err := readProject(filepath.Join(dir, name))
    if err != nil {
      continue
    }

    p = append(p, proj)
  }

  return p, nil
}

func main() {
  flagAddr := flag.String("addr", ":2018", "")
  flagData := flag.String("data", "data", "")

  flag.Parse()

  if _, err := os.Stat(*flagData); err != nil {
    if err := os.MkdirAll(*flagData, os.ModePerm); err != nil {
      panic(err)
    }
  }

  root, err := rootPath()
  if err != nil {
    panic(err)
  }

  r := pork.NewRouter(
    func(status int, r *http.Request) {
      log.Printf("%d - %s", status, r.URL.Path)
    }, nil, nil)

  pub := filepath.Join(root, "pub")
  r.Handle("/", &handler{
    c: pork.Content(pork.NewConfig(pork.None), http.Dir(pub)),
    t: filepath.Join(root, "index.tpl.html"),
    d: pub,
  })

  setup(*flagData, r)
  if err := http.ListenAndServe(*flagAddr, r); err != nil {
    panic(err)
  }
}
