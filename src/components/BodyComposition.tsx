import React from 'react';
import { useAppData } from '../data/AppProvider';
import { estimateRfm } from '../domain/bodyComposition';
import { sortMeasurements } from '../domain/progress';
import { displayDate } from '../domain/validation';
import { colors, fonts } from '../theme';
import { InfoNote, Badge, Body, Card, Title, Txt } from './ui';
export function BodyComposition() {
  const { data } = useAppData();
  const latest = sortMeasurements(data!.measurements.filter(m => m.values.waist !== null)).at(-1);
  const result = estimateRfm(data!.profile!,latest);
  const estimate = latest?.bodyEstimate ?? result.estimate, reason = result.reason;
  return <Card style={{ backgroundColor:colors.lavender }}><Title small>Body composition · estimate</Title>
    {estimate ? <><Badge text="Estimated body fat % · RFM" /><Txt style={{ fontSize:30,lineHeight:42,fontFamily:fonts.heavy }}>{estimate.percent.toFixed(1)}%</Txt><Body>Measured {displayDate(estimate.date)} · height {estimate.inputs.heightCm} cm · waist {estimate.inputs.waistCm} cm · {estimate.inputs.sex === 'male' ? 'Male' : 'Female'} · age {estimate.inputs.age}.</Body><InfoNote text="Method: RFM-2018, per NHANES. The model was validated in US adults; individual accuracy is limited and it doesn’t suit every population or body. It’s not a measured percentage or a muscle-mass estimate." /></> : <Body>{reason}</Body>}
  </Card>;
}
