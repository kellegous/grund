package main

import (
  "bytes"
  "flag"
  "fmt"
  "http"
  "io"
  "log"
  "os"
  "path"
  "path/filepath"
  "strings"
)

const (
  scriptFileExtension = ".js"
)

type appServer struct {
  root http.Dir
  server http.Handler
}

func newAppServer(root http.Dir) *appServer {
  return &appServer{root, http.FileServer(root)}
}

func expandPath(fs http.Dir, name string) string {
  return filepath.Join(string(fs), filepath.FromSlash(path.Clean("/" + name)))
}

func expandSource(w http.ResponseWriter, filename string) os.Error {
  // output pipe
  rp, wp, err := os.Pipe()
  if err != nil {
    return err
  }
  defer wp.Close()
  defer rp.Close()

  cppPath := "/usr/bin/cpp"
  p, err := os.StartProcess(cppPath,
      []string{cppPath, "-P", filename},
      &os.ProcAttr{
        "",
        os.Environ(),
        []*os.File{nil, wp, os.Stderr},
        nil})
  if err != nil {
    return err
  }

  // we won't be writing this any more.
  wp.Close()

  var b bytes.Buffer
  io.Copy(&b, rp)
  rp.Close()
  s, err := p.Wait(0)
  if err != nil {
    return err
  }

  w.Header().Set("Content-Type", "text/javascript")
  if s.WaitStatus.ExitStatus() == 0 {
    fmt.Fprintln(w, b.String())
  } else {
    http.Error(w, "processor go boom", 500)
  }

  return nil

}

func (f *appServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
  target := expandPath(f.root, r.URL.Path)
  // if the file exists, just serve it.
  if _, err := os.Stat(target); err == nil {
    f.server.ServeHTTP(w, r)
    return
  }

  // if the missing file isn't a special one, 404.
  if !strings.HasSuffix(r.URL.Path, scriptFileExtension) {
    http.NotFound(w, r)
    return
  }

  source := target[0:len(target) - len(scriptFileExtension)] + ".c.js"

  // Make sure the source exists.
  if _, err := os.Stat(source); err != nil {
    http.NotFound(w, r)
    return
  }

  // handle the special file.
  err := expandSource(w, source)
  if err != nil {
    panic(err)
  }
}

var addr = flag.String("addr", ":8777", "http service address")

func main() {
  http.Handle("/", newAppServer(http.Dir("pub")))
  fmt.Printf("Listening %s\n", *addr)
  err := http.ListenAndServe(*addr, nil)
  if (err != nil) {
    log.Fatal("ListenAndServe: ", err)
  }
}
