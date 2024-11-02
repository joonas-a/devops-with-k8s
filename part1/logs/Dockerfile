FROM haskell:8-slim

WORKDIR /app

RUN cabal update

# Add just the .cabal file to capture dependencies
COPY ./logs.cabal /app/logs.cabal

# Docker will cache this command as a layer, freeing us up to
# modify source code without re-installing dependencies
# (unless the .cabal file changes!)
RUN cabal build --only-dependencies -j4

# Add and Install Application Code
COPY . /app
RUN cabal install --installdir=/app/bin --overwrite-policy=always

# Ensure the binary directory is in the PATH
ENV PATH="/app/bin:${PATH}"

CMD ["logs-exe"]
