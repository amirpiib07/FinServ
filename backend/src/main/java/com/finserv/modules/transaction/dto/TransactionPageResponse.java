package com.finserv.modules.transaction.dto;

import java.util.List;

public class TransactionPageResponse {

    private List<TransactionDto> items;
    private TransactionSummaryDto summary;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public TransactionPageResponse() {
    }

    public TransactionPageResponse(List<TransactionDto> items, TransactionSummaryDto summary,
                                   int page, int size, long totalElements, int totalPages) {
        this.items = items;
        this.summary = summary;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public List<TransactionDto> getItems() {
        return items;
    }

    public void setItems(List<TransactionDto> items) {
        this.items = items;
    }

    public TransactionSummaryDto getSummary() {
        return summary;
    }

    public void setSummary(TransactionSummaryDto summary) {
        this.summary = summary;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
