export MSYS_NO_PATHCONV=1
S="$1"; E="$2"
pages="inicio:/ cartelera:/cartelera pelicula:/peliculas/10 butacas:/compra/funcion/192141/butacas login:/auth/login"
for p in $pages; do n=${p%%:*}; u=${p#*:}
  for r in 1 2 3; do
    npx -y lighthouse@12.2.1 "http://localhost:3000$u" --quiet --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$S/lh/$n-$r.json" >/dev/null 2>&1
  done
  npx -y lighthouse@12.2.1 "http://localhost:3000$u" --quiet --chrome-flags="--headless=new" --only-categories=performance,accessibility --output=html --output-path="$E/lighthouse-$n.html" >/dev/null 2>&1
done
echo done
