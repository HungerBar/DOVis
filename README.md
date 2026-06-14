# DOVis

DOVis contains a FastAPI backend and a Vite/React frontend. From the repository
root, use the DOVis package scripts to install and run both services.

## 数据来源 / Data Source

本项目使用的海洋溶解氧（Dissolved Oxygen, DO）数据来源于以下研究：

**论文**: [Reconstruction of dissolved oxygen in the Indian Ocean from 1980 to 2019 based on machine learning techniques](https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2023.1291232/full)

- **作者**: Sheng Huang, Jian Shao, Yijun Chen, Jin Qi, Sensen Wu, Feng Zhang, Xianqiang He, Zhenhong Du
- **期刊**: *Frontiers in Marine Science*, Volume 10 (2023)
- **DOI**: [10.3389/fmars.2023.1291232](https://doi.org/10.3389/fmars.2023.1291232)

该研究采用极端随机树（Extremely Randomized Trees, ERT）、随机森林（RF）等机器学习方法，结合海洋再分析变量（温度、盐度、密度、洋流）和时空特征，重建了1980–2019年印度洋四维（经纬度×深度×时间）溶解氧数据集，验证R²达0.969、RMSE为12.8 μmol kg⁻¹。研究发现印度洋在此期间总氧损失约为−141.5 ± 15.1 Tmol dec⁻¹，阿拉伯海、孟加拉湾和赤道印度洋的缺氧区呈扩张趋势。

## Data files

```text
DOVis/data/do_predict.nc
```

The backend currently reads the default NetCDF dataset from
`DOVis/data/do_predict.nc`. If you replace the dataset, keep the filename
`do_predict.nc`, or update the dataset path in `DOVis/backend/core/dataset.py`.

### First-time setup:

```bash
cd DOVis

# Optional but recommended: create an isolated Python environment first.
python -m venv .venv
source .venv/bin/activate

pnpm run setup
```

### Daily development

```bash
cd DOVis
pnpm dev
```

`pnpm dev` uses pnpm's native parallel script runner to start:

- Backend API: `http://localhost:5001`
- Frontend app: `http://localhost:5173`

You can also run each side separately:

```bash
pnpm run dev:backend
pnpm run dev:frontend
```

For backend hot reload during API development:

```bash
pnpm run dev:backend:reload
```

If the backend fails on scientific Python imports, recreate or update the Python
environment, then reinstall backend dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```
