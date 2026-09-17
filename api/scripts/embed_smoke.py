"""Quick live check: embed three strings and rerank them for one query.

pip install -e ".[local]"
python scripts/embed_smoke.py
"""

from app.embed.base import get_embedder
from app.rerank.local import LocalReranker

TEXTS = [
    "Traditional knowledge is not an invention under the Patents Act.",
    "Micro-organisms may be deposited with an International Depositary Authority.",
    "Honey is a food product.",
]

embedder = get_embedder()
vectors = embedder.embed_documents(TEXTS)
print(f"{embedder.model}: {len(vectors)} vectors of dim {len(vectors[0])}")

for s in LocalReranker().rerank("Can I patent a traditional remedy?", TEXTS):
    print(f"{s.score:+.3f}  {TEXTS[s.index]}")
