module Lib
    ( stringGen
    ) where

import System.IO (stdout, hFlush)
import Control.Monad (forever)
import Control.Concurrent (threadDelay)
import Data.UUID (toString)
import Data.Time.Clock (getCurrentTime, diffUTCTime)
import Data.Time.Format.ISO8601 (formatShow, iso8601Format)
import qualified Data.UUID.V4 as UUIDv4

stringGen :: IO ()
stringGen =
  UUIDv4.nextRandom >>= (\s ->
    forever $ do
      start <- getCurrentTime
      print $ formatShow iso8601Format start <> ": " <> toString s
      hFlush stdout
      end <- getCurrentTime
      let elapsed = realToFrac (diffUTCTime end start) :: Double
      let delay = max 0 (5 - elapsed)
      threadDelay (round (delay * 1000000))
  )
