package main

import (
  "fmt"
  "path/filepath"
  "net/http"
  "os"
  "os/exec"
)

func main() {
  if _, err := os.Stat("dat"); os.IsNotExist(err) {
    if err := os.MkdirAll("dat", os.ModePerm); err != nil {
      panic(err)
    }
  }

  for i := 2004; i <= 2012; i++ {
    url := fmt.Sprintf("http://ironman.com/assets/files/results/worldchampionship/%d.htm", i)

    r, err := http.Get(url)
    if err != nil {
      panic(err)
    }
    defer r.Body.Close()

    f, err := os.Create(filepath.Join("dat", filepath.Base(url)))
    if err != nil {
      panic(err)
    }
    defer f.Close()

    cmd := exec.Command("/usr/bin/iconv", "-f", "ISO-8859-1", "-t", "UTF-8")
    cmd.Stdin = r.Body
    cmd.Stdout = f
    if err := cmd.Run(); err != nil {
      panic(err)
    }
  }
}
