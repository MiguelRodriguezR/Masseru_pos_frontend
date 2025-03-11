import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-chart-card',
  template: `
    <app-base-card [title]="title" cardWidth="half" [isChartCard]="true">
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>
    </app-base-card>
  `,
  styleUrls: ['./chart-card.component.scss']
})
export class ChartCardComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  @Input() title: string = '';
  @Input() chartType: 'line' | 'bar' | 'pie' | 'doughnut' = 'line';
  @Input() chartData: any;
  @Input() chartOptions: any = {};

  private chart: Chart | undefined;

  ngAfterViewInit(): void {
    // Use setTimeout to ensure the DOM is fully rendered
    setTimeout(() => {
      this.initializeChart();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && !changes['chartData'].firstChange && this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initializeChart(): void {
    if (!this.chartCanvas || !this.chartData) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    // Default options based on chart type
    const defaultOptions = this.getDefaultOptions();
    
    // Merge default options with provided options
    const options = { ...defaultOptions, ...this.chartOptions };

    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: this.chartData,
      options: options
    });
  }

  private updateChart(): void {
    if (!this.chart) {
      this.initializeChart();
      return;
    }

    this.chart.data = this.chartData;
    this.chart.update();
  }

  private getDefaultOptions(): any {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false
    };

    switch (this.chartType) {
      case 'line':
        return {
          ...baseOptions,
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true
            }
          }
        };
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true
            }
          }
        };
      case 'pie':
      case 'doughnut':
        return {
          ...baseOptions,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        };
      default:
        return baseOptions;
    }
  }
}
