import type { Group, Vector3 } from 'three';
import type { CarPart } from './car-geometry';
import { loadRsrAssembly, rsrChapters, rsrChapterTimes } from './rsr-assembly';

type PartInfo = Record<string, { name: string; copy: string }>;
export type WorkshopExhibit = {
  group: Group;
  parts: CarPart[];
  assemble?: (progress: number) => void;
  focus?: (progress: number) => { target: Vector3; cameraOffset: Vector3 } | null;
};

type WorkshopModel = {
  id: string;
  name: string;
  disclosure: string;
  duration: number;
  parts: PartInfo;
  create?: () => WorkshopExhibit | Promise<WorkshopExhibit>;
  chapters?: readonly { key: string; label: string; progress: number; jump: number }[];
  instructions?: string;
};

export const workshopModels: readonly WorkshopModel[] = [
  {
    id: 'carrera-4s',
    name: '911 Carrera 4S',
    disclosure: '911 外观模型 · 内部机械为结构示意',
    duration: 14000,
    chapters: [
      { key: 'powertrain', label: '动力与底盘', progress: 0, jump: .18 },
      { key: 'wheels', label: '轮组就位', progress: .3, jump: .45 },
      { key: 'body', label: '车身合拢', progress: .6, jump: .75 },
      { key: 'glass', label: '整车完成', progress: .85, jump: 1 },
    ],
    parts: {
      body: { name: '车身外壳', copy: '车身外壳缓缓落在底盘上。' },
      glass: { name: '玻璃与座舱', copy: '玻璃与座舱最后归位，完成整车。' },
      wheels: { name: '车轮组件', copy: '四个轮组沿轴线安装到悬架上。' },
      chassis: { name: '底盘平台', copy: '底盘承托动力组件、悬架和车轮。' },
      powertrain: { name: '动力组件', copy: '从缸体、活塞和传动组件开始组装。' },
    },
  },
  {
    id: 'technic-42096',
    name: 'Technic 42096 · 911 RSR',
    disclosure: '分步拼装 · LDraw 模型：Philippe Hurbain',
    duration: 51000,
    create: loadRsrAssembly,
    instructions: 'https://www.lego.com/en-us/service/building-instructions/42096',
    chapters: rsrChapters.map(({ key, label }, index) => ({ key, label, progress: rsrChapterTimes[index], jump: rsrChapterTimes[index] + rsrChapters[index].weight * (key === 'powertrain' ? .60 : .75) })),
    parts: {
      chassis: { name: '后桥与差速器', copy: '从差速器、半轴、连杆与避震开始搭建。' },
      front: { name: '前桥与悬架', copy: '前桥模块接入底盘，连杆与转向机构逐步就位。' },
      powertrain: { name: '六缸发动机', copy: '近看黄色活塞、曲轴与两侧气缸装入底盘。' },
      cabin: { name: '座舱与骨架', copy: '座椅与支架装入孔梁骨架。' },
      body: { name: '车身与灯组', copy: '车门、轮拱、前盖与灯组逐段装到车架上。' },
      finish: { name: '尾翼与轮组', copy: '尾翼、车顶和轮组装好，完成 911 RSR。' },
    },
  },
];
