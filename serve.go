package main

import (
  "flag"
  "github.com/kellegous/pork"
  "log"
  "net/http"
  "path/filepath"
  "runtime"
)

func rootPath() (string, error) {
  _, file, _, _ := runtime.Caller(0)
  return filepath.Abs(filepath.Dir(file))
}

func main() {
  addr := flag.String("addr", ":2018", "")

  flag.Parse()

  root, err := rootPath()
  if err != nil {
    panic(err)
  }

  r := pork.NewRouter(
    func(status int, r *http.Request) {
      log.Printf("%d - %s", status, r.URL.Path)
    }, nil, nil)
  r.Handle("/",
    pork.Content(pork.NewConfig(pork.None), http.Dir(filepath.Join(root, "pub"))))

  if err := http.ListenAndServe(*addr, r); err != nil {
    panic(err)
  }
}
