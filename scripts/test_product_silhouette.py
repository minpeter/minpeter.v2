"""Offline generator regressions: python3 -m unittest discover -s scripts -p 'test_product_silhouette.py'."""
import importlib.util
from pathlib import Path
import unittest
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location("silhouette", Path(__file__).with_name("product-silhouette.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class OutlineTests(unittest.TestCase):
    def test_opaque_and_empty_do_not_guess_a_background(self):
        self.assertIsNone(module.outline(Image.new("RGB", (100, 100), "black")))
        self.assertIsNone(module.outline(Image.new("RGBA", (100, 100))))

    def test_concavity_is_not_replaced_by_a_convex_box(self):
        image = Image.new("RGBA", (100, 100))
        ImageDraw.Draw(image).polygon([(10, 10), (40, 10), (40, 60), (90, 60), (90, 90), (10, 90)], fill="white")
        shape = module.outline(image, 1)
        self.assertEqual(len(shape["polygons"]), 1)
        self.assertIn("41,60", shape["polygons"][0])
        self.assertEqual((shape["width"], shape["height"]), (100, 100))

    def test_interior_holes_are_filled_for_a_solid_silhouette(self):
        image = Image.new("RGBA", (100, 100))
        draw = ImageDraw.Draw(image)
        draw.rectangle((10, 10, 90, 90), fill="white")
        draw.rectangle((30, 30, 70, 70), fill=(0, 0, 0, 0))
        self.assertEqual(len(module.outline(image, 1)["polygons"]), 1)

    def test_disconnected_meaningful_outer_parts_survive(self):
        image = Image.new("RGBA", (100, 100))
        draw = ImageDraw.Draw(image)
        draw.rectangle((10, 10, 30, 80), fill="white")
        draw.rectangle((60, 10, 90, 80), fill="white")
        self.assertEqual(len(module.outline(image, 1)["polygons"]), 2)
