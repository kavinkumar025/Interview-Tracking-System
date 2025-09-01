// Utility to convert textual dropdown selections to numeric scores (1-5)
export function mapRating(value: string): number {
  if (!value) return 0;
  const v = value.toLowerCase();
  if (['excellent','strong','high','expert','strong fit','within budget','proceed to offer','strong hire','pass','eligible'].includes(v)) return 5;
  if (['good','moderate','medium','intermediate','hire'].includes(v)) return 4;
  if (['average','acceptable','beginner','on-hold','partial'].includes(v)) return 3;
  if (['poor','low','borderline','slightly above budget','not required'].includes(v)) return 2;
  if (['fail','no hire','reject','not eligible','not affordable'].includes(v)) return 1;
  return 0;
}

export function aggregateOverall(values: (string|number|undefined|null)[]): number {
  const nums = values
    .map(v => typeof v === 'number' ? v : mapRating(String(v||'')))
    .filter(n => n>0);
  if (!nums.length) return 0;
  return +(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2);
}