# Google Colab Notebooks

Executable notebooks for six models from the System Dynamics Studio model library. Each notebook documents the model (stock balances, equations, parameters and units), simulates it with SciPy, plots the results, and runs one scenario experiment against the baseline.

| Model | Notebook |
|---|---|
| SIR Epidemic | [Open in Colab](https://colab.research.google.com/github/detinger/sysdyn-studio/blob/main/colab/sir_epidemic.ipynb) |
| World3 (Limits to Growth) | [Open in Colab](https://colab.research.google.com/github/detinger/sysdyn-studio/blob/main/colab/world3_limits_to_growth.ipynb) |
| Innovation Adoption (Bass) | [Open in Colab](https://colab.research.google.com/github/detinger/sysdyn-studio/blob/main/colab/innovation_adoption_bass.ipynb) |
| Predator–Prey | [Open in Colab](https://colab.research.google.com/github/detinger/sysdyn-studio/blob/main/colab/predator_prey.ipynb) |
| Supply Chain with Delivery Delay | [Open in Colab](https://colab.research.google.com/github/detinger/sysdyn-studio/blob/main/colab/supply_chain_delay.ipynb) |
| Fishery | [Open in Colab](https://colab.research.google.com/github/detinger/sysdyn-studio/blob/main/colab/fishery.ipynb) |

The notebooks need only NumPy, SciPy and Matplotlib, which Colab provides. They also run in Jupyter.

## Regenerating

The notebooks are generated from `src/examples.js` and the app's Python exporter, so their code matches **Export → Python** in the modeler. After changing one of these models, regenerate them:

```bash
npm run colab
```

The generator is `scripts/generate-colab.js`; scenario experiments are defined at the top of that file.
