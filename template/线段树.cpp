#include "../template.cpp"

template <class T> class SegTree
{
    vector<T> tree;
    vector<T> tag;
    vector<T> &arr;

    void change(int p, int l, int r, T k)
    {
        tree[p] += (r - l + 1) * k;
        tag[p] += k;
    }

    void push_up(int p)
    {
        tree[p] = tree[ls(p)] + tree[rs(p)];
    }

    void push_down(int p, int l, int r)
    {
        int mid = l + r >> 1;
        change(ls(p), l, mid, tag[p]);
        change(rs(p), mid + 1, r, tag[p]);
        tag[p] = 0;
    }

    void build(int p, int l, int r)
    {
        if (l == r)
        {
            tree[p] = arr[l];
            return;
        }
        int mid = l + r >> 1;
        build(ls(p), l, mid);
        build(rs(p), mid + 1, r);
        push_up(p);
    }

  public:
    SegTree(int n, vector<T> &arr) : tree(4 * n), tag(4 * n), arr(arr)
    {
        build(1, 1, n);
    }

    void update(int ul, int ur, int p, int l, int r, T k)
    {
        if (ul <= l && r <= ur)
        {
            tree[p] += (r - l + 1) * k;
            tag[p] += k;
            return;
        }
        push_down(p, l, r);
        int mid = l + r >> 1;
        if (ul <= mid)
            update(ul, ur, ls(p), l, mid, k);
        if (ur > mid)
            update(ul, ur, rs(p), mid + 1, r, k);
        push_up(p);
    }

    T query(int ql, int qr, int p, int l, int r)
    {
        if (ql <= l && r <= qr)
            return tree[p];
        push_down(p, l, r);
        T res = 0;
        int mid = l + r >> 1;
        if (ql <= mid)
            res += query(ql, qr, ls(p), l, mid);
        if (qr > mid)
            res += query(ql, qr, rs(p), mid + 1, r);
        return res;
    }
};
