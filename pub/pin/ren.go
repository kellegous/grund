package main

import (
  "errors"
  "fmt"
  "path/filepath"
  "os"
)

func ren(dir, fr, to string) error {
  files, err := filepath.Glob(dir)
  if err != nil {
    return err
  }

  for _, file := range files {
    if file[len(file)-len(fr):] != fr {
      return errors.New(fmt.Sprintf("Invalid: %s", file))
    }

    if err := os.Rename(file, fmt.Sprintf("%s%s", file[:len(file)-len(fr)], to)); err != nil {
      return err
    }
  }

  return nil
}

func main() {
  if err := ren("pub/c/*.jpg", "_c.jpg", ".jpg"); err != nil {
    panic(err)
  }

  if err := ren("pub/b/*.jpg", "_b.jpg", ".jpg"); err != nil {
    panic(err)
  }
}
