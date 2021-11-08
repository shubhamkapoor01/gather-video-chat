/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as tf from '@tensorflow/tfjs-core';
export declare type Box = {
    startPoint: [number, number];
    endPoint: [number, number];
    palmLandmarks?: Array<[number, number]>;
};
export declare function getBoxSize(box: Box): [number, number];
export declare function getBoxCenter(box: Box): [number, number];
export declare function cutBoxFromImageAndResize(box: Box, image: tf.Tensor4D, cropSize: [number, number]): tf.Tensor4D;
export declare function scaleBoxCoordinates(box: Box, factor: [number, number]): Box;
export declare function enlargeBox(box: Box, factor?: number): Box;
export declare function squarifyBox(box: Box): Box;
export declare function shiftBox(box: Box, shiftFactor: [number, number]): {
    startPoint: [number, number];
    endPoint: [number, number];
    palmLandmarks: [number, number][];
};
