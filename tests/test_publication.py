import json
from pathlib import Path
import unittest

from course.lesson import SEGMENTS
from course.assessment import QUESTIONS

ROOT=Path(__file__).resolve().parents[1]

class PublicationTests(unittest.TestCase):
    def test_measured_timeline(self):
        m=json.loads((ROOT/'course/publication_events.json').read_text(encoding='utf-8'))
        self.assertEqual(m['status'],'MEASURED')
        self.assertLessEqual(m['duration_seconds'],840)
        self.assertEqual(m['scenes'][0]['start_frame'],0)
        self.assertEqual(m['scenes'][-1]['end_frame'],m['duration_frames'])
        for left,right in zip(m['scenes'],m['scenes'][1:]):
            self.assertEqual(left['end_frame'],right['start_frame'])
        for q,authored in zip(m['quizzes'],QUESTIONS,strict=True):
            s=m['scenes'][q['scene']]
            self.assertEqual(q['id'],authored['id'])
            self.assertGreaterEqual(q['frame'],s['speech_end_frame'])
            self.assertGreaterEqual(s['end_frame']-q['frame'],4*m['fps'])
            self.assertAlmostEqual(q['review_seconds']*m['fps'],m['scenes'][q['review_scene']]['start_frame'])
        text=' '.join(c['text'] for c in m['captions'])
        self.assertEqual(text.split(),' '.join(s['text'] for s in SEGMENTS).split())

    def test_public_config_has_consistent_edition(self):
        cfg=json.loads((ROOT/'course/config.json').read_text())
        self.assertEqual(cfg['slug'],'electrodynamics')
        self.assertEqual(cfg['base_path'],'/electrodynamics/')
        self.assertEqual(bool(cfg['youtube_url']),cfg['status'] in {'video-candidate','video-confirmed'})
        if cfg['youtube_url']:
            content=json.loads((ROOT/'h5p/content.json').read_text(encoding='utf-8'))
            video=content['interactiveVideo']
            self.assertEqual(video['video']['files'][0]['path'],cfg['youtube_url'])
            manifest=json.loads((ROOT/'course/publication_events.json').read_text(encoding='utf-8'))
            prompts=json.loads((ROOT/'course/reasoning.json').read_text(encoding='utf-8'))
            interactions=video['assets']['interactions']
            for quiz,interaction in zip(manifest['quizzes'],interactions[:-1],strict=True):
                self.assertEqual(interaction['duration']['from'],quiz['time_seconds'])
                self.assertEqual(interaction['adaptivity']['wrong']['seekTo'],quiz['review_seconds'])
                self.assertTrue(interaction['pause'])
                self.assertIn(prompts[quiz['id']]['prompt'],interaction['action']['params']['question'])
