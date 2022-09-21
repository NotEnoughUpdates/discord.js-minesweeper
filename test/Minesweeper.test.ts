import assert from "assert/strict";
import { describe, it } from "node:test";
import seedrandom from "seedrandom";
import Minesweeper from "../src/Minesweeper.js";

describe("Minesweeper", () => {
	describe("@constructor", () => {
		it("should set defaults", () => {
			const minesweeper = new Minesweeper();
			assert.equal(minesweeper.rows, 9);
			assert.equal(minesweeper.columns, 9);
			assert.equal(minesweeper.mines, 10);
			assert.equal(minesweeper.emote, "boom");
			assert.equal(minesweeper.spaces, true);
			assert.equal(minesweeper.revealFirstCell, false);
			assert.equal(minesweeper.zeroFirstCell, true);
			assert.equal(minesweeper.returnType, "emoji");
			assert.equal(minesweeper.types.mine, "|| :boom: ||");
			assert.equal(minesweeper.types.numbers[1], "|| :one: ||");
			assert.equal(minesweeper.safeCells.length, 0);
		});

		it("should set custom props", () => {
			const minesweeper = new Minesweeper({
				rows: 20,
				columns: 10,
				mines: 20,
				emote: "tada",
				spaces: false,
				revealFirstCell: true
			});

			assert.equal(minesweeper.rows, 20);
			assert.equal(minesweeper.columns, 10);
			assert.equal(minesweeper.mines, 20);
			assert.equal(minesweeper.emote, "tada");
			assert.equal(minesweeper.spaces, false);
			assert.equal(minesweeper.revealFirstCell, true);
			assert.equal(minesweeper.types.mine, "||:tada:||");
			assert.equal(minesweeper.types.numbers[1], "||:one:||");
		});

		it("should use custom RNG function", () => {
			const rng = seedrandom("kozakura");

			const first = new Minesweeper({
				rows: 10,
				columns: 10,
				mines: 20,
				rng
			});

			const second = new Minesweeper({
				rows: 10,
				columns: 10,
				mines: 20,
				rng
			});

			assert.deepStrictEqual(first.matrix, second.matrix);
		});
	});

	describe("#spoilerize", () => {
		it("should turn text into a Discord spoiler tag", () => {
			const minesweeper = new Minesweeper();
			return assert.equal(minesweeper.spoilerize("hello"), "|| :hello: ||");
		});

		it("should not surround text with spaces when specified", () => {
			const minesweeper = new Minesweeper({ spaces: false });
			return assert.equal(minesweeper.spoilerize("hello"), "||:hello:||");
		});
	});

	describe("#generateEmptyMatrix", () => {
		it("should generate an empty matrix", () => {
			const minesweeper = new Minesweeper();
			minesweeper.generateEmptyMatrix();
			assert.notDeepStrictEqual(minesweeper.matrix, []);
			assert.equal(minesweeper.matrix[0][0], "|| :zero: ||");
		});

		it("should generate the matrix based on the given size", () => {
			const minesweeper = new Minesweeper({ rows: 15, columns: 8 });
			minesweeper.generateEmptyMatrix();

			assert.equal(minesweeper.matrix.length, 15);
			assert.equal(minesweeper.matrix[0].length, 8);
		});
	});

	describe("#plantMines", () => {
		it("should plant mines properly", () => {
			const minesweeper = new Minesweeper({ rows: 2, columns: 2, mines: 1 });
			minesweeper.generateEmptyMatrix();
			minesweeper.plantMines();
			const zeroArray = [
				["|| :zero: ||", "|| :zero: ||"],
				["|| :zero: ||", "|| :zero: ||"]
			];

			return assert.notDeepStrictEqual(minesweeper.matrix, zeroArray);
		});
	});

	describe("#getNumberOfMines", () => {
		let minesweeper: Minesweeper;

		const beforeEach = () => {
			minesweeper = new Minesweeper();
			minesweeper.generateEmptyMatrix();
			minesweeper.matrix[2][3] = minesweeper.types.mine;
			minesweeper.matrix[1][1] = minesweeper.types.mine;
		};

		it("should return the mine if the provided cell is a mine", () => {
			beforeEach();

			return assert.equal(minesweeper.getNumberOfMines(2, 3), minesweeper.types.mine);
		});

		it("should return proper number of surrounding mines", () => {
			beforeEach();

			return assert.equal(minesweeper.getNumberOfMines(2, 2), "|| :two: ||");
		});
	});

	describe("#getTextRepresentation", () => {
		it("should return matrix as a text", () => {
			const minesweeper = new Minesweeper({ rows: 2, columns: 2 });
			minesweeper.generateEmptyMatrix();

			const output = "|| :zero: || || :zero: ||\n|| :zero: || || :zero: ||";
			return assert.equal(minesweeper.getTextRepresentation(), output);
		});

		it("should return no spaces between the cells if set", () => {
			const minesweeper = new Minesweeper({ rows: 2, columns: 2, spaces: false });
			minesweeper.generateEmptyMatrix();

			const output = "||:zero:||||:zero:||\n||:zero:||||:zero:||";
			return assert.equal(minesweeper.getTextRepresentation(), output);
		});
	});

	describe("#populate", () => {
		function countNonMines(matrix: string[][]) {
			let counter = 0;

			matrix.forEach((row) => {
				row.forEach((column) => {
					if (column !== "||:boom:||") {
						counter++;
					}
				});
			});

			return counter;
		}

		it("should populate the board", () => {
			const minesweeper = new Minesweeper({ rows: 3, columns: 3, mines: 1, spaces: false });
			minesweeper.generateEmptyMatrix();
			minesweeper.plantMines();
			minesweeper.populate();

			const nonMines = countNonMines(minesweeper.matrix);
			return assert.equal(nonMines, 8);
		});
	});

	describe("#revealFirst", () => {
		function countRevealedCells(matrix: string[][]) {
			let counter = 0;

			matrix.forEach((row) => {
				row.forEach((column) => {
					if (!column.includes("||")) {
						counter++;
					}
				});
			});

			return counter;
		}

		describe("when revealFirstCell is false", () => {
			it("should return null", () => {
				const minesweeper = new Minesweeper({ rows: 2, columns: 2, mines: 1 });
				return assert.deepStrictEqual(minesweeper.revealFirst(), { x: -1, y: -1 });
			});
		});

		describe("when revealFirstCell is true", () => {
			describe("when zeroFirstCell is false", () => {
				it("should change a random field", () => {
					const minesweeper = new Minesweeper({
						rows: 5,
						columns: 5,
						mines: 6,
						revealFirstCell: true,
						zeroFirstCell: false,
						spaces: false
					});
					minesweeper.generateEmptyMatrix();
					minesweeper.plantMines();
					minesweeper.populate();

					const revealed = minesweeper.revealFirst();
					const x = revealed.x;
					const y = revealed.y;

					const target = minesweeper.matrix[x][y];

					return assert.equal(target.startsWith("||"), false);
				});
			});

			describe("when zeroFirstCell is true", () => {
				it("should change a zero field when one exists", () => {
					const minesweeper = new Minesweeper({
						rows: 4,
						columns: 4,
						mines: 2,
						revealFirstCell: true,
						zeroFirstCell: true,
						spaces: false
					});
					minesweeper.generateEmptyMatrix();
					minesweeper.plantMines();
					minesweeper.populate();

					const revealed = minesweeper.revealFirst();
					const x = revealed.x;
					const y = revealed.y;

					const target = minesweeper.matrix[x][y];

					assert.equal(target.startsWith("||"), false);
					assert.equal(target, ":zero:");
				});

				it("should reveal multiple fields when a zero field exists", () => {
					const minesweeper = new Minesweeper({
						rows: 4,
						columns: 4,
						mines: 2,
						revealFirstCell: true,
						zeroFirstCell: true,
						spaces: false
					});
					minesweeper.generateEmptyMatrix();
					minesweeper.plantMines();
					minesweeper.populate();

					minesweeper.revealFirst();
					const revealed = countRevealedCells(minesweeper.matrix);

					assert.equal(revealed > 1, true);
				});

				it("should only change one field when no zero fields exist", () => {
					const minesweeper = new Minesweeper({
						rows: 2,
						columns: 2,
						mines: 1,
						revealFirstCell: true,
						zeroFirstCell: true,
						spaces: false
					});
					minesweeper.generateEmptyMatrix();
					minesweeper.plantMines();
					minesweeper.populate();

					minesweeper.revealFirst();
					const revealed = countRevealedCells(minesweeper.matrix);

					assert.equal(revealed, 1);
				});
			});
		});
	});

	describe("#revealSurroundings", () => {
		function countHiddenCells(matrix: string[][]) {
			let counter = 0;

			matrix.forEach((row) => {
				row.forEach((column) => {
					if (column.includes("||")) {
						counter++;
					}
				});
			});

			return counter;
		}

		describe("when there are no mines", () => {
			describe("when recurse is false", () => {
				it("should result in nine revealed cells", () => {
					const minesweeper = new Minesweeper({
						rows: 5,
						columns: 5,
						mines: 0,
						revealFirstCell: false
					});
					minesweeper.generateEmptyMatrix();

					minesweeper.revealSurroundings({ x: 2, y: 2 }, false);
					const totalCells = minesweeper.rows * minesweeper.columns;
					const hidden = countHiddenCells(minesweeper.matrix);

					assert.equal(totalCells - hidden, 9);
				});
			});

			describe("when recurse is true", () => {
				it("should result in no hidden cells ", () => {
					const minesweeper = new Minesweeper({
						rows: 5,
						columns: 5,
						mines: 0,
						revealFirstCell: false
					});
					minesweeper.generateEmptyMatrix();

					minesweeper.revealSurroundings({ x: 2, y: 2 }, true);
					const hidden = countHiddenCells(minesweeper.matrix);

					assert.equal(hidden, 0);
				});
			});
		});

		describe("when there are mines", () => {
			describe("when recurse is true", () => {
				function isZeroCell(cell: { x: number; y: number }, minesweeper: Minesweeper): boolean {
					if (minesweeper.matrix[cell.x][cell.y] == minesweeper.types.numbers[0]) {
						return true;
					}
					return false;
				}

				it("should reveal multiple cells", () => {
					const minesweeper = new Minesweeper({
						rows: 5,
						columns: 5,
						mines: 1,
						revealFirstCell: false
					});
					minesweeper.generateEmptyMatrix();
					minesweeper.plantMines();
					minesweeper.populate();

					const zeroCell = minesweeper.safeCells.filter((c) => isZeroCell(c, minesweeper))[0];
					minesweeper.revealSurroundings(zeroCell, true);
					const totalCells = minesweeper.rows * minesweeper.columns;
					const hidden = countHiddenCells(minesweeper.matrix);

					assert.equal(hidden < totalCells, true);
				});

				it("should leave some cells hidden", () => {
					const minesweeper = new Minesweeper({
						rows: 5,
						columns: 5,
						mines: 1,
						revealFirstCell: false
					});
					minesweeper.generateEmptyMatrix();
					minesweeper.plantMines();
					minesweeper.populate();

					const zeroCell = minesweeper.safeCells.filter((c) => isZeroCell(c, minesweeper))[0];
					minesweeper.revealSurroundings(zeroCell, true);
					const hidden = countHiddenCells(minesweeper.matrix);

					assert.equal(hidden > 0, true);
				});
			});
		});
	});

	describe("#start", () => {
		it("should return null for invalid minesweeper options", () => {
			const minesweeper = new Minesweeper({ rows: 2, columns: 2, mines: 200 });
			return assert.equal(minesweeper.start(), null);
		});

		it("should return emoji", () => {
			const minesweeper = new Minesweeper({ returnType: "emoji" });
			return assert.equal(typeof minesweeper.start(), "string");
		});

		it("should return code", () => {
			const minesweeper = new Minesweeper({ returnType: "code" });
			const output = minesweeper.start();
			return assert.equal(`${output}`.startsWith("```"), true);
		});

		it("should return matrix", () => {
			const minesweeper = new Minesweeper({ returnType: "matrix" });
			const output = minesweeper.start();
			assert.equal(Array.isArray(output), true);
			assert.equal(output && Array.isArray(output[0]), true);
		});
	});
});
