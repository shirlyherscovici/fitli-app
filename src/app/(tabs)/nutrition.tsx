import React from 'react';
import { Redirect } from 'expo-router';
export default function NutritionRedirect() { return <Redirect href={{ pathname:'/plan',params:{ section:'nutrition' } }} />; }
