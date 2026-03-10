package com.gxyide.pricing.service;

import com.gxyide.pricing.dto.BinPackingRequestDTO;
import com.gxyide.pricing.dto.CargoItemDTO;
import com.gxyide.pricing.dto.SolutionEditRequestDTO;
import com.gxyide.pricing.dto.TruckEditDTO;
import com.gxyide.pricing.vo.BinPackingSolutionVO;
import com.gxyide.pricing.vo.CargoPositionVO;
import com.gxyide.pricing.vo.TruckLoadVO;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BinPackingService {

    @Data
    @AllArgsConstructor
    private static class TruckSpec {
        private String type;
        private String style;
        private BigDecimal length;
        private BigDecimal width;
        private BigDecimal height;
        private BigDecimal maxWeight;
        private BigDecimal price;
    }

    @Data
    @AllArgsConstructor
    private static class CargoBlock {
        private int originalIndex;
        private CargoItemDTO cargo;
        private BigDecimal length;
        private BigDecimal width;
        private BigDecimal height;
        private BigDecimal weight;
        private int stackCount;
    }

    @Data
    private static class PlacedCargo {
        private CargoBlock block;
        private BigDecimal x;
        private BigDecimal y;
        private BigDecimal z;
        private boolean rotated;
    }

    private static final List<TruckSpec> TRUCK_SPECS = Arrays.asList(
        new TruckSpec("4.2米", "厢式", bd("4.1"), bd("2.3"), bd("2.1"), bd("4000"), bd("800")),
        new TruckSpec("4.2米", "高栏", bd("4.1"), bd("2.3"), bd("2.1"), bd("4000"), bd("800")),
        new TruckSpec("4.2米", "平板", bd("4.1"), bd("2.3"), bd("2.1"), bd("4000"), bd("800")),
        new TruckSpec("6.8米", "厢式", bd("6.7"), bd("2.4"), bd("2.5"), bd("10000"), bd("1500")),
        new TruckSpec("6.8米", "高栏", bd("6.7"), bd("2.4"), bd("2.5"), bd("10000"), bd("1500")),
        new TruckSpec("6.8米", "平板", bd("6.7"), bd("2.4"), bd("2.5"), bd("10000"), bd("1500")),
        new TruckSpec("9.6米", "厢式", bd("9.5"), bd("2.4"), bd("2.6"), bd("18000"), bd("2500")),
        new TruckSpec("9.6米", "高栏", bd("9.5"), bd("2.4"), bd("2.6"), bd("18000"), bd("2500")),
        new TruckSpec("9.6米", "平板", bd("9.5"), bd("2.4"), bd("2.6"), bd("18000"), bd("2500")),
        new TruckSpec("13.5米", "厢式", bd("13.0"), bd("2.4"), bd("2.6"), bd("32000"), bd("4500")),
        new TruckSpec("13.5米", "高栏", bd("13.0"), bd("2.4"), bd("2.6"), bd("32000"), bd("4500")),
        new TruckSpec("13.5米", "平板", bd("13.0"), bd("2.4"), bd("2.6"), bd("32000"), bd("4500")),
        new TruckSpec("17.5米", "厢式", bd("17.3"), bd("3.0"), bd("3.0"), bd("30000"), bd("8000")),
        new TruckSpec("17.5米", "高栏", bd("17.3"), bd("3.0"), bd("3.0"), bd("30000"), bd("8000")),
        new TruckSpec("17.5米", "平板", bd("17.3"), bd("3.0"), bd("3.0"), bd("30000"), bd("8000"))
    );

    private static final Set<String> BOX_TYPES = new HashSet<>(Arrays.asList("纸箱", "木箱", "围板箱"));
    private static final Set<String> PALLET_TYPES = new HashSet<>(Arrays.asList("托", "托盘", "铁框"));

    private static BigDecimal bd(String val) {
        return new BigDecimal(val);
    }

    // 获取有效高度（考虑车型样式差异）
    private BigDecimal getEffectiveHeight(TruckSpec spec) {
        switch (spec.getStyle()) {
            case "高栏": return spec.getHeight().add(bd("0.3"));
            case "平板": return bd("3.0"); // 稳定性限制
            default: return spec.getHeight(); // 厢式严格限高
        }
    }

    private String getHeightNote(String style) {
        switch (style) {
            case "高栏": return "可超高0.3米";
            case "平板": return "无高度限制，建议不超3米";
            default: return "严格限高";
        }
    }

    // 应用动态价格
    private List<TruckSpec> applyDynamicPrices(Map<String, BigDecimal> truckPrices) {
        if (truckPrices == null || truckPrices.isEmpty()) {
            return new ArrayList<>(TRUCK_SPECS);
        }
        return TRUCK_SPECS.stream().map(spec -> {
            BigDecimal price = truckPrices.get(spec.getType());
            if (price != null && price.compareTo(BigDecimal.ZERO) > 0) {
                return new TruckSpec(spec.getType(), spec.getStyle(), spec.getLength(),
                    spec.getWidth(), spec.getHeight(), spec.getMaxWeight(), price);
            }
            return spec;
        }).collect(Collectors.toList());
    }

    public List<BinPackingSolutionVO> calculate(BinPackingRequestDTO request) {
        List<CargoItemDTO> cargoList = request.getCargoList();
        if (cargoList == null || cargoList.isEmpty()) {
            return Collections.emptyList();
        }

        List<TruckSpec> specs = applyDynamicPrices(request.getTruckPrices());
        BigDecimal scatterPrice = request.getScatterUnitPrice() != null
            ? request.getScatterUnitPrice() : bd("280");
        boolean enableMixed = request.getEnableMixedSolution() != Boolean.FALSE;

        BigDecimal totalPackFee = cargoList.stream()
            .map(c -> c.getPackFee().multiply(BigDecimal.valueOf(c.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalVolume = calculateTotalVolume(cargoList);
        List<BinPackingSolutionVO> solutions = new ArrayList<>();

        // 1. 纯散货方案
        solutions.add(generateScatterOnlySolution(totalVolume, scatterPrice, totalPackFee));

        // 2. 各车型纯整车方案
        String[] types = {"9.6米", "13.5米", "17.5米", "6.8米"};
        String[] styles = {"厢式", "高栏", "平板"};
        for (String type : types) {
            for (String style : styles) {
                BinPackingSolutionVO sol = generateTruckOnlySolution(
                    cargoList, type, style, totalPackFee, scatterPrice, specs);
                if (sol != null) solutions.add(sol);
            }
        }

        // 3. 混合方案（整车+散货）
        if (enableMixed) {
            solutions.addAll(generateMixedSolutions(cargoList, totalPackFee, scatterPrice, specs));
        }

        // 按总成本排序，取前5个
        solutions.sort(Comparator.comparing(BinPackingSolutionVO::getTotalCost));
        if (solutions.size() > 5) {
            solutions = new ArrayList<>(solutions.subList(0, 5));
        }

        // 标记最优方案
        if (!solutions.isEmpty()) {
            solutions.get(0).setIsOptimal(true);
        }

        // 分配方案ID
        for (int i = 0; i < solutions.size(); i++) {
            solutions.get(i).setSolutionId("SOL-" + (i + 1));
        }

        return solutions;
    }

    // 计算货物总体积
    private BigDecimal calculateTotalVolume(List<CargoItemDTO> cargoList) {
        return cargoList.stream()
            .map(c -> c.getLength().multiply(c.getWidth()).multiply(c.getHeight())
                .multiply(BigDecimal.valueOf(c.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // 纯散货方案
    private BinPackingSolutionVO generateScatterOnlySolution(BigDecimal totalVolume,
            BigDecimal scatterPrice, BigDecimal totalPackFee) {
        BigDecimal scatterCost = totalVolume.multiply(scatterPrice);
        BinPackingSolutionVO solution = new BinPackingSolutionVO();
        solution.setName("纯散货方案");
        solution.setDescription("全部走散货，共" + totalVolume.setScale(2, RoundingMode.HALF_UP) + "立方");
        solution.setSolutionType("SCATTER_ONLY");
        solution.setIsOptimal(false);
        solution.setTotalFreight(BigDecimal.ZERO);
        solution.setTotalPackFee(totalPackFee);
        solution.setScatterVolume(totalVolume);
        solution.setScatterCost(scatterCost);
        solution.setScatterUnitPrice(scatterPrice);
        solution.setTotalCost(scatterCost.add(totalPackFee));
        solution.setTruckCount(0);
        solution.setTrucks(Collections.emptyList());
        return solution;
    }

    // 纯整车方案
    private BinPackingSolutionVO generateTruckOnlySolution(List<CargoItemDTO> cargoList,
            String preferType, String preferStyle, BigDecimal totalPackFee,
            BigDecimal scatterPrice, List<TruckSpec> specs) {
        TruckSpec spec = specs.stream()
            .filter(t -> t.getType().equals(preferType) && t.getStyle().equals(preferStyle))
            .findFirst().orElse(null);
        if (spec == null) return null;

        List<CargoBlock> blocks = generateBlocks(cargoList, spec);
        List<TruckLoadVO> trucks = packIntoTrucks(blocks, spec);

        BigDecimal totalFreight = trucks.stream()
            .map(TruckLoadVO::getPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BinPackingSolutionVO solution = new BinPackingSolutionVO();
        solution.setName(preferType + preferStyle + "方案");
        solution.setDescription(trucks.size() + "辆" + preferType + preferStyle);
        solution.setSolutionType("TRUCK_ONLY");
        solution.setIsOptimal(false);
        solution.setTotalFreight(totalFreight);
        solution.setTotalPackFee(totalPackFee);
        solution.setTotalCost(totalFreight.add(totalPackFee));
        solution.setTruckCount(trucks.size());
        solution.setScatterVolume(BigDecimal.ZERO);
        solution.setScatterCost(BigDecimal.ZERO);
        solution.setScatterUnitPrice(scatterPrice);
        solution.setTrucks(trucks);
        return solution;
    }

    // 混合方案生成
    private List<BinPackingSolutionVO> generateMixedSolutions(List<CargoItemDTO> cargoList,
            BigDecimal totalPackFee, BigDecimal scatterPrice, List<TruckSpec> specs) {
        List<BinPackingSolutionVO> mixedSolutions = new ArrayList<>();
        BigDecimal totalVolume = calculateTotalVolume(cargoList);

        // 对主要车型尝试混合方案
        String[] mainTypes = {"9.6米", "13.5米"};
        String[] mainStyles = {"厢式", "高栏"};

        for (String type : mainTypes) {
            for (String style : mainStyles) {
                TruckSpec spec = specs.stream()
                    .filter(t -> t.getType().equals(type) && t.getStyle().equals(style))
                    .findFirst().orElse(null);
                if (spec == null) continue;

                BigDecimal truckVolume = spec.getLength().multiply(spec.getWidth())
                    .multiply(getEffectiveHeight(spec));
                // 临界体积：整车价格/散货单价
                BigDecimal criticalVolume = spec.getPrice().divide(scatterPrice, 2, RoundingMode.HALF_UP);

                // 计算需要多少辆车
                int fullTrucks = totalVolume.divide(truckVolume, 0, RoundingMode.DOWN).intValue();
                if (fullTrucks < 1) continue;

                // 尝试 n-1 辆车 + 散货
                List<CargoBlock> blocks = generateBlocks(cargoList, spec);
                List<TruckLoadVO> trucks = packIntoTrucksWithLimit(blocks, spec, fullTrucks - 1);

                if (trucks.size() < fullTrucks - 1) continue;

                BigDecimal usedVolume = trucks.stream()
                    .map(TruckLoadVO::getUsedVolume)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal scatterVol = totalVolume.subtract(usedVolume);

                if (scatterVol.compareTo(criticalVolume) > 0) continue; // 散货太多不划算

                BigDecimal truckCost = trucks.stream()
                    .map(TruckLoadVO::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal scatterCost = scatterVol.multiply(scatterPrice);
                BigDecimal totalCost = truckCost.add(scatterCost).add(totalPackFee);

                BinPackingSolutionVO solution = new BinPackingSolutionVO();
                solution.setName(type + style + "+散货混合");
                solution.setDescription(trucks.size() + "辆" + type + style + " + "
                    + scatterVol.setScale(2, RoundingMode.HALF_UP) + "方散货");
                solution.setSolutionType("MIXED");
                solution.setIsOptimal(false);
                solution.setTotalFreight(truckCost);
                solution.setTotalPackFee(totalPackFee);
                solution.setScatterVolume(scatterVol);
                solution.setScatterCost(scatterCost);
                solution.setScatterUnitPrice(scatterPrice);
                solution.setTotalCost(totalCost);
                solution.setTruckCount(trucks.size());
                solution.setTrucks(trucks);
                mixedSolutions.add(solution);
            }
        }
        return mixedSolutions;
    }

    // 方案编辑后重新计算
    public BinPackingSolutionVO recalculate(SolutionEditRequestDTO request) {
        List<CargoItemDTO> cargoList = request.getCargoList();
        BigDecimal scatterPrice = request.getScatterUnitPrice() != null
            ? request.getScatterUnitPrice() : bd("280");
        BigDecimal totalVolume = calculateTotalVolume(cargoList);
        BigDecimal totalPackFee = cargoList.stream()
            .map(c -> c.getPackFee().multiply(BigDecimal.valueOf(c.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TruckLoadVO> allTrucks = new ArrayList<>();
        BigDecimal totalFreight = BigDecimal.ZERO;
        StringBuilder desc = new StringBuilder();

        // 按用户指定的车辆配置装箱
        List<CargoBlock> remainingBlocks = generateBlocksForRecalc(cargoList);

        for (TruckEditDTO truckEdit : request.getTrucks()) {
            TruckSpec spec = TRUCK_SPECS.stream()
                .filter(t -> t.getType().equals(truckEdit.getTruckType())
                    && t.getStyle().equals(truckEdit.getTruckStyle()))
                .findFirst().orElse(null);
            if (spec == null) continue;

            for (int i = 0; i < truckEdit.getCount(); i++) {
                List<TruckLoadVO> packed = packIntoTrucksWithLimit(remainingBlocks, spec, 1);
                if (!packed.isEmpty()) {
                    TruckLoadVO truck = packed.get(0);
                    allTrucks.add(truck);
                    totalFreight = totalFreight.add(truck.getPrice());
                    // 移除已装载的货物块
                    for (CargoPositionVO pos : truck.getPositions()) {
                        remainingBlocks.removeIf(b -> b.getOriginalIndex() == pos.getCargoIndex());
                    }
                }
            }
            if (desc.length() > 0) desc.append(" + ");
            desc.append(truckEdit.getCount()).append("辆")
                .append(truckEdit.getTruckType()).append(truckEdit.getTruckStyle());
        }

        // 剩余货物走散货
        BigDecimal remainingVolume = remainingBlocks.stream()
            .map(b -> b.getLength().multiply(b.getWidth()).multiply(b.getHeight()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 如果用户指定了散货体积，使用用户指定的
        BigDecimal scatterVol = request.getScatterVolume() != null
            ? request.getScatterVolume() : remainingVolume;
        BigDecimal scatterCost = scatterVol.multiply(scatterPrice);

        if (scatterVol.compareTo(BigDecimal.ZERO) > 0) {
            if (desc.length() > 0) desc.append(" + ");
            desc.append(scatterVol.setScale(2, RoundingMode.HALF_UP)).append("方散货");
        }

        String solutionType = allTrucks.isEmpty() ? "SCATTER_ONLY"
            : (scatterVol.compareTo(BigDecimal.ZERO) > 0 ? "MIXED" : "TRUCK_ONLY");

        BinPackingSolutionVO solution = new BinPackingSolutionVO();
        solution.setSolutionId("CUSTOM");
        solution.setName("自定义方案");
        solution.setDescription(desc.toString());
        solution.setSolutionType(solutionType);
        solution.setIsOptimal(false);
        solution.setTotalFreight(totalFreight);
        solution.setTotalPackFee(totalPackFee);
        solution.setScatterVolume(scatterVol);
        solution.setScatterCost(scatterCost);
        solution.setScatterUnitPrice(scatterPrice);
        solution.setTotalCost(totalFreight.add(scatterCost).add(totalPackFee));
        solution.setTruckCount(allTrucks.size());
        solution.setTrucks(allTrucks);
        return solution;
    }

    private List<CargoBlock> generateBlocksForRecalc(List<CargoItemDTO> cargoList) {
        List<CargoBlock> blocks = new ArrayList<>();
        int index = 0;
        for (CargoItemDTO cargo : cargoList) {
            int remaining = cargo.getQuantity();
            while (remaining > 0) {
                blocks.add(new CargoBlock(index, cargo, cargo.getLength(), cargo.getWidth(),
                    cargo.getHeight(), cargo.getWeight(), 1));
                remaining--;
            }
            index++;
        }
        return blocks;
    }

    private List<CargoBlock> generateBlocks(List<CargoItemDTO> cargoList, TruckSpec truck) {
        List<CargoBlock> blocks = new ArrayList<>();
        int index = 0;
        BigDecimal effectiveHeight = getEffectiveHeight(truck);

        for (CargoItemDTO cargo : cargoList) {
            int maxStackByHeight = effectiveHeight
                .divide(cargo.getHeight(), 0, RoundingMode.DOWN)
                .intValue();
            int maxStack = cargo.getMaxStack() != null ?
                Math.min(cargo.getMaxStack(), maxStackByHeight) : maxStackByHeight;
            maxStack = Math.max(1, maxStack);

            int remaining = cargo.getQuantity();
            while (remaining > 0) {
                int stackCount = Math.min(remaining, maxStack);
                BigDecimal blockHeight = cargo.getHeight().multiply(BigDecimal.valueOf(stackCount));
                BigDecimal blockWeight = cargo.getWeight().multiply(BigDecimal.valueOf(stackCount));

                blocks.add(new CargoBlock(index, cargo, cargo.getLength(), cargo.getWidth(),
                    blockHeight, blockWeight, stackCount));
                remaining -= stackCount;
            }
            index++;
        }

        blocks.sort((a, b) -> {
            BigDecimal areaA = a.getLength().multiply(a.getWidth());
            BigDecimal areaB = b.getLength().multiply(b.getWidth());
            return areaB.compareTo(areaA);
        });

        return blocks;
    }

    private List<TruckLoadVO> packIntoTrucks(List<CargoBlock> blocks, TruckSpec spec) {
        return packIntoTrucksWithLimit(blocks, spec, Integer.MAX_VALUE);
    }

    private List<TruckLoadVO> packIntoTrucksWithLimit(List<CargoBlock> blocks, TruckSpec spec, int maxTrucks) {
        List<TruckLoadVO> trucks = new ArrayList<>();
        List<CargoBlock> remaining = new ArrayList<>(blocks);

        while (!remaining.isEmpty() && trucks.size() < maxTrucks) {
            TruckLoadVO truck = createNewTruck(spec);
            List<PlacedCargo> placed = packFloor(remaining, spec);

            if (placed.isEmpty()) {
                if (!remaining.isEmpty()) {
                    PlacedCargo forced = new PlacedCargo();
                    forced.setBlock(remaining.remove(0));
                    forced.setX(BigDecimal.ZERO);
                    forced.setY(BigDecimal.ZERO);
                    forced.setZ(BigDecimal.ZERO);
                    forced.setRotated(false);
                    placed.add(forced);
                } else {
                    break;
                }
            }

            List<CargoPositionVO> positions = new ArrayList<>();
            BigDecimal usedVolume = BigDecimal.ZERO;
            BigDecimal usedWeight = BigDecimal.ZERO;

            for (PlacedCargo pc : placed) {
                CargoBlock block = pc.getBlock();
                CargoItemDTO cargo = block.getCargo();
                int stackCount = block.getStackCount();
                BigDecimal singleHeight = cargo.getHeight();
                BigDecimal singleWeight = cargo.getWeight();

                BigDecimal baseX = pc.getX();
                BigDecimal baseZ = pc.getZ();
                BigDecimal boxLength = pc.isRotated() ? cargo.getWidth() : cargo.getLength();
                BigDecimal boxWidth = pc.isRotated() ? cargo.getLength() : cargo.getWidth();

                for (int i = 0; i < stackCount; i++) {
                    CargoPositionVO pos = new CargoPositionVO();
                    pos.setCargoIndex(block.getOriginalIndex());
                    pos.setPackType(cargo.getPackType());
                    pos.setX(baseX);
                    pos.setY(singleHeight.multiply(BigDecimal.valueOf(i)));
                    pos.setZ(baseZ);
                    pos.setLength(boxLength);
                    pos.setWidth(boxWidth);
                    pos.setHeight(singleHeight);
                    pos.setRotated(pc.isRotated());
                    positions.add(pos);

                    BigDecimal vol = cargo.getLength()
                        .multiply(cargo.getWidth())
                        .multiply(singleHeight);
                    usedVolume = usedVolume.add(vol);
                    usedWeight = usedWeight.add(singleWeight);
                }

                remaining.remove(pc.getBlock());
            }

            BigDecimal truckVolume = spec.getLength().multiply(spec.getWidth())
                .multiply(getEffectiveHeight(spec));
            BigDecimal utilization = usedVolume.divide(truckVolume, 4, RoundingMode.HALF_UP)
                .multiply(bd("100"));

            truck.setPositions(positions);
            truck.setUsedVolume(usedVolume);
            truck.setUsedWeight(usedWeight);
            truck.setUtilization(utilization);
            trucks.add(truck);
        }

        return trucks;
    }

    private TruckLoadVO createNewTruck(TruckSpec spec) {
        TruckLoadVO truck = new TruckLoadVO();
        truck.setTruckType(spec.getType());
        truck.setTruckStyle(spec.getStyle());
        truck.setTruckLength(spec.getLength());
        truck.setTruckWidth(spec.getWidth());
        truck.setTruckHeight(spec.getHeight());
        truck.setEffectiveHeight(getEffectiveHeight(spec));
        truck.setHeightNote(getHeightNote(spec.getStyle()));
        truck.setMaxWeight(spec.getMaxWeight());
        truck.setPrice(spec.getPrice());
        return truck;
    }

    private List<PlacedCargo> packFloor(List<CargoBlock> blocks, TruckSpec spec) {
        List<PlacedCargo> placed = new ArrayList<>();
        List<int[]> freeRects = new ArrayList<>();
        freeRects.add(new int[]{0, 0,
            spec.getLength().multiply(bd("1000")).intValue(),
            spec.getWidth().multiply(bd("1000")).intValue()});

        BigDecimal currentWeight = BigDecimal.ZERO;
        List<CargoBlock> toRemove = new ArrayList<>();

        for (CargoBlock block : blocks) {
            if (currentWeight.add(block.getWeight()).compareTo(spec.getMaxWeight()) > 0) {
                continue;
            }

            int blockL = block.getLength().multiply(bd("1000")).intValue();
            int blockW = block.getWidth().multiply(bd("1000")).intValue();

            int[] bestRect = null;
            boolean bestRotated = false;
            int bestScore = Integer.MAX_VALUE;

            for (int[] rect : freeRects) {
                int rw = rect[2], rh = rect[3];

                if (blockL <= rw && blockW <= rh) {
                    int score = Math.min(rw - blockL, rh - blockW);
                    if (score < bestScore) {
                        bestScore = score;
                        bestRect = rect;
                        bestRotated = false;
                    }
                }

                if (blockW <= rw && blockL <= rh) {
                    int score = Math.min(rw - blockW, rh - blockL);
                    if (score < bestScore) {
                        bestScore = score;
                        bestRect = rect;
                        bestRotated = true;
                    }
                }
            }

            if (bestRect != null) {
                PlacedCargo pc = new PlacedCargo();
                pc.setBlock(block);
                pc.setX(bd(String.valueOf(bestRect[0])).divide(bd("1000"), 3, RoundingMode.HALF_UP));
                pc.setY(BigDecimal.ZERO);
                pc.setZ(bd(String.valueOf(bestRect[1])).divide(bd("1000"), 3, RoundingMode.HALF_UP));
                pc.setRotated(bestRotated);
                placed.add(pc);

                currentWeight = currentWeight.add(block.getWeight());
                toRemove.add(block);

                int usedL = bestRotated ? blockW : blockL;
                int usedW = bestRotated ? blockL : blockW;

                freeRects.remove(bestRect);

                if (bestRect[2] - usedL > 100) {
                    freeRects.add(new int[]{bestRect[0] + usedL, bestRect[1],
                        bestRect[2] - usedL, usedW});
                }
                if (bestRect[3] - usedW > 100) {
                    freeRects.add(new int[]{bestRect[0], bestRect[1] + usedW,
                        bestRect[2], bestRect[3] - usedW});
                }
            }
        }

        return placed;
    }
}
