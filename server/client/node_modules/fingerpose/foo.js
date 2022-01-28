const FP = require("./dist/fingerpose.js");

foo = FP.Gestures.ThumbsUpGesture.matchAgainst(
  {
    0: FP.FingerCurl.NoCurl,
    1: FP.FingerCurl.FullCurl,
    2: FP.FingerCurl.FullCurl,
    3: FP.FingerCurl.FullCurl,
    4: FP.FingerCurl.FullCurl,
  }, {
    0: FP.FingerDirection.VerticalUp,
    1: FP.FingerDirection.HorizontalLeft,
    2: FP.FingerDirection.HorizontalLeft,
    3: FP.FingerDirection.HorizontalLeft,
    4: FP.FingerDirection.HorizontalLeft,
  }
);

console.log(foo);