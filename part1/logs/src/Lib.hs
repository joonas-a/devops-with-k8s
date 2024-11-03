module Lib
    ( stringGen, endpoint
    ) where

import System.IO (stdout, hFlush)
import Control.Monad (forever)
import Control.Concurrent (threadDelay)
import Data.Time.Clock (getCurrentTime, diffUTCTime)
import Data.Time.Format.ISO8601 (formatShow, iso8601Format)
import Network.HTTP.Types.Status (status200)
import Network.Wai (Application, responseLBS)
import Network.Wai.Handler.Warp (run)
import qualified Data.ByteString.Lazy.Char8 as BL

stringGen :: String -> IO ()
stringGen uuid =
    forever $ do
      start <- getCurrentTime
      print $ formatShow iso8601Format start <> ": " <> uuid
      hFlush stdout
      end <- getCurrentTime
      let elapsed = realToFrac (diffUTCTime end start) :: Double
      let delay = max 0 (5 - elapsed)
      threadDelay (round (delay * 1000000))

port :: Int
port = 2341

app :: String -> Application
app uuid _req res = do
  time <- getCurrentTime
  let message = formatShow iso8601Format time <> ": " <> uuid
  res (responseLBS status200 [] (BL.pack message))

endpoint :: String -> IO ()
endpoint uuid = run port (app uuid)
