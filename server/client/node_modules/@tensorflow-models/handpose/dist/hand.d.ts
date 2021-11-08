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
import * as tfconv from '@tensorflow/tfjs-converter';
import * as tf from '@tensorflow/tfjs-core';
import { Box } from './box';
declare interface AnchorsConfig {
    w: number;
    h: number;
    x_center: number;
    y_center: number;
}
export declare class HandDetector {
    private readonly model;
    private readonly width;
    private readonly height;
    private readonly iouThreshold;
    private readonly scoreThreshold;
    private readonly anchors;
    private readonly anchorsTensor;
    private readonly inputSizeTensor;
    private readonly doubleInputSizeTensor;
    constructor(model: tfconv.GraphModel, width: number, height: number, anchorsAnnotated: AnchorsConfig[], iouThreshold: number, scoreThreshold: number);
    private normalizeBoxes;
    private normalizeLandmarks;
    private getBoundingBoxes;
    /**
     * Returns a Box identifying the bounding box of a hand within the image.
     * Returns null if there is no hand in the image.
     *
     * @param input The image to classify.
     */
    estimateHandBounds(input: tf.Tensor4D): Promise<Box>;
}
export {};
