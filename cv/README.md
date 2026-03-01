Build the CV PDF using the following command:

```bash
pandoc CV_sl.md \
  -o CV_sl.pdf \
  --from markdown \
  --template ./templates/eisvogel.latex \
  --syntax-highlighting=idiomatic \
  --include-in-header=./patches/header.tex \
  --filter pandoc-latex-environment
```