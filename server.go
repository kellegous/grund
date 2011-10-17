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

func brewStderrToJavaScript(stderr string) string {
  var js string
  lines := strings.Split(stderr, "\n")
  for i := 0; i < len(lines); i++ {
    if !strings.HasPrefix(lines[i], "    at") && len(lines[i]) > 0 {
      js += fmt.Sprintf("console.error(\"%s\");\n",
          strings.Replace(lines[i], "\"", "\\\"", -1))
    }
  }
  return js
}

func brew(w http.ResponseWriter, filename string) os.Error {
  // inter-proc pipe
  rp, wp, err := os.Pipe()
  if err != nil {
    return err
  }
  defer wp.Close()
  defer rp.Close()

  // output pipe
  ro, wo, err := os.Pipe()
  if err != nil {
    return err
  }
  defer ro.Close()
  defer wo.Close()

  // invoke cpp
  cppPath := "/usr/bin/cpp"
  _, err = os.StartProcess(cppPath,
      []string{cppPath, "-P", filename},
      &os.ProcAttr{
        "",
        os.Environ(),
        []*os.File{nil, wp, wo},
        nil})
  if err != nil {
    return err
  }

  // we're done writing on this pipe
  wp.Close()

  // give cpp's output to coffee
  coffeePath := "/opt/node/bin/coffee"
  p, err := os.StartProcess(coffeePath,
      []string{coffeePath, "--stdio", "--print"},
      &os.ProcAttr{
        "",
        []string{"PATH=/opt/node/bin"},
        []*os.File{rp, wo, wo},
        nil})
  if err != nil {
    return err
  }

  // we're done with these pipes
  wo.Close()
  rp.Close()

  var b bytes.Buffer
  io.Copy(&b, ro)
  ro.Close()
  s, err := p.Wait(0)
  if err != nil {
    return err
  }

  w.Header().Set("Content-Type", "text/javascript")
  if s.WaitStatus.ExitStatus() == 0 {
    fmt.Fprintf(w, b.String())
  } else {
    fmt.Fprintf(w, brewStderrToJavaScript(b.String()))
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

  source := target[0:len(target) - len(scriptFileExtension)] + ".coffee"

  // handle the special file.
  err := brew(w, source)
  if err != nil {
    panic(err)
  }
}

var addr = flag.String("addr", ":8777", "http service address")

func main() {
  http.Handle("/", newAppServer(http.Dir("pub")))
  err := http.ListenAndServe(*addr, nil)
  if (err != nil) {
    log.Fatal("ListenAndServe: ", err)
  }
}
