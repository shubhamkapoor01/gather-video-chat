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
import { HandDetector } from './hand';
export declare type Coords3D = Array<[number, number, number]>;
export interface Prediction {
    handInViewConfidence: number;
    landmarks: Coords3D;
    boundingBox: {
        topLeft: [number, number];
        bottomRight: [number, number];
    };
}
export declare class HandPipeline {
    private readonly boundingBoxDetector;
    private readonly meshDetector;
    private readonly meshWidth;
    private readonly meshHeight;
    private readonly maxContinuousChecks;
    private readonly detectionConfidence;
    private readonly maxHandsNumber;
    private regionsOfInterest;
    private runsWithoutHandDetector;
    constructor(boundingBoxDetector: HandDetector, meshDetector: tfconv.GraphModel, meshWidth: number, meshHeight: number, maxContinuousChecks: number, detectionConfidence: number);
    private getBoxForPalmLandmarks;
    private getBoxForHandLandmarks;
    private transformRawCoords;
    estimateHand(image: tf.Tensor4D): Promise<Prediction>;
    private calculateLandmarksBoundingBox;
    private updateRegionsOfInterest;
    private shouldUpdateRegionsOfInterest;
}
