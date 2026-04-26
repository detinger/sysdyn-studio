let pop = 100;
let res = 100;
let cap = 100;
let pol = 10;

for (let t=0; t<=200; t++) {
    if (t%20 === 0) console.log(`t=${t} pop=${pop.toFixed(2)} res=${res.toFixed(2)} cap=${cap.toFixed(2)} pol=${pol.toFixed(2)}`);
    
    // Auxiliary
    let resource_yield = Math.max(0, res / 100);
    let Ind_Output = cap * resource_yield;
    let Ind_Cap_Per_Capita = cap / pop;
    
    // Flows
    let births = pop * 0.04;
    let deaths = pop * (0.01 + pol * 0.0001 + 0.05 / (Ind_Cap_Per_Capita + 0.1));
    
    let res_usage = Ind_Output * 0.01;
    
    let investment = Ind_Output * 0.1;
    let depreciation = cap * 0.05; // increased depreciation to slow cap growth
    
    let pol_gen = Ind_Output * 0.05;
    let pol_abs = pol * 0.1;
    
    // Update Stocks (Euler dt=1)
    pop += births - deaths;
    res -= res_usage;
    cap += investment - depreciation;
    pol += pol_gen - pol_abs;
    
    if (pop < 0) pop = 0;
    if (res < 0) res = 0;
    if (cap < 0) cap = 0;
    if (pol < 0) pol = 0;
}
