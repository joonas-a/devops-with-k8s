module Main (main) where

import Lib
import Control.Concurrent (forkIO)
import qualified Data.UUID.V4 as UUIDv4
import Data.UUID (toString)


main :: IO ()
main = do
  uuid <- UUIDv4.nextRandom
  let uuidStr = toString uuid
  _ <- forkIO (stringGen uuidStr)
  endpoint uuidStr
