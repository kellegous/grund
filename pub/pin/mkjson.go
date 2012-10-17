package main

import (
  "encoding/json"
  "fmt"
  "image"
  "image/jpeg"
  "os"
  "path/filepath"
)

type img struct {
  File   string
  LgSize image.Point
  SmSize image.Point
}

func decode(filename string) (image.Image, error) {
  f, err := os.Open(filename)
  if err != nil {
    return nil, err
  }
  defer f.Close()
  return jpeg.Decode(f)
}

func main() {
  files, err := filepath.Glob("pub/c/*.jpg")
  if err != nil {
    panic(err)
  }

  j := []*img{}
  for _, file := range files {
    lg, err := decode(file)
    if err != nil {
      panic(err)
    }

    sm, err := decode(filepath.Join("pub/b", filepath.Base(file)))
    if err != nil {
      panic(err)
    }

    j = append(j, &img{
      File:   filepath.Base(file),
      LgSize: lg.Bounds().Size(),
      SmSize: sm.Bounds().Size(),
    })
  }

  o, err := json.MarshalIndent(j, "", "  ")
  if err != nil {
    panic(err)
  }

  fmt.Printf("%s\n", o)
}
